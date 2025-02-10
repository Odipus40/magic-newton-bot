require('dotenv').config();
const axios = require('axios');

const loginUrl = 'https://www.magicnewton.com/portal/api/auth/session';

const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
    console.error("❌ Private Key tidak ditemukan. Pastikan file .env telah diisi.");
    process.exit(1);
}

const login = async () => {
    console.log("\n⏳ Memulai proses login ke MagicNewton...");

    try {
        const response = await axios.post(loginUrl, {
            private_key: privateKey
        }, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200 && response.data.session_token) {
            console.log(`✅ Login berhasil! Token sesi: ${response.data.session_token}`);

            // Preview user info jika tersedia
            if (response.data.user) {
                console.log("\n👤 **User Info:**");
                console.log(`   🔹 Nama: ${response.data.user.name}`);
                console.log(`   🔹 Email: ${response.data.user.email || "Tidak tersedia"}`);
                console.log(`   🔹 ID: ${response.data.user.id}`);
            } else {
                console.log("⚠️ User info tidak ditemukan dalam response.");
            }

        } else {
            console.error(`⚠️ Login gagal, status: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Terjadi kesalahan saat login:`, error.response?.data || error.message);
    }
};

login();
