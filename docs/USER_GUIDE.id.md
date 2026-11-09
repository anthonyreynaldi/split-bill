# Panduan Pengguna

*English: [USER_GUIDE.md](USER_GUIDE.md)*

## Apa fungsi aplikasi ini
Split Bill membantu kelompok menghitung siapa berutang ke siapa setelah makan bersama atau jalan-jalan. Foto struknya, dan aplikasi akan membaca daftar itemnya. Lalu pilih siapa memesan apa, dan aplikasi menghitung bagian setiap orang, termasuk pajak dan biaya layanan.

## Memulai
1. Buka aplikasi lalu pilih **Daftar**. Masukkan email dan kata sandi.
2. Masuk (login).
3. Gunakan tombol **ID / EN** di bagian atas untuk mengganti bahasa kapan saja.

## Fitur: Acara (Event)
**Acara** mengelompokkan beberapa tagihan, misalnya "Liburan Bali" atau "Makan Siang Jumat".
1. Klik **Acara baru** dan beri nama.
2. Tambahkan **orang-orang** dalam acara. Cukup nama, tidak perlu akun.
   - Ketik nama lalu tekan **Enter**. Kotak langsung kosong lagi, jadi Anda bisa mengetik nama berikutnya.
   - Untuk menambah banyak sekaligus, tempel daftar seperti `Ana, Budi, Citra` (atau satu nama per baris).
   - Perbaiki nama dengan mengetik langsung di kotaknya. Hapus seseorang dengan ikon tempat sampah, atau kembalikan dengan ikon batal.
   - Setelah selesai, klik **Simpan**. Belum ada yang tersimpan sebelum ini, dan **Buang** membatalkan perubahan. Jika Anda menghapus orang, akan ada konfirmasi. Pembagian mereka dihapus, dan tagihan yang mereka bayar tidak punya pembayar.

## Fitur: Tambah tagihan dari foto
1. Di dalam acara, klik **Tambah tagihan**. Lalu:
   - di ponsel, ketuk **Ambil foto** untuk memakai kamera, atau **Pilih foto** untuk memilih dari galeri atau file;
   - di komputer, klik **Pilih foto**.
2. Tunggu beberapa detik selagi aplikasi membaca struk. Foto langsung tampil. Jika berhasil dibaca, ada baris kecil yang menyebut model AI yang membacanya.
3. **Periksa hasilnya dengan melihat foto.** Perbaiki item, jumlah, atau harga yang salah. Jika total di struk berbeda dengan total hitungan, akan muncul peringatan berisi nominal di struk.
   - Di komputer, struk tetap terlihat di samping daftar item saat Anda menggulir.
   - Di ponsel, ketuk **Lihat struk** untuk menyematkannya di bagian atas layar, lalu gulir item di bawahnya. Ketuk **Sembunyikan struk** untuk menutupnya.
   - Gunakan tombol di atas foto untuk memperbesar, mengepaskan ke lebar, memutar foto yang miring, atau membukanya dalam ukuran penuh.
4. Pilih **siapa yang membayar** tagihan ini.
5. Klik **Simpan**. Belum ada yang tersimpan sebelum ini.

> Foto dikirim ke layanan AI untuk membaca teksnya. Jika gagal, foto tetap terlampir dan Anda bisa mengetik itemnya sendiri.

## Fitur: Tambah atau ubah tagihan secara manual
Klik **Tambah tagihan** dan isi formulir di bawah kotak unggah. Klik **Tambah item** untuk setiap baris (nama, jumlah, harga). Total baris dihitung otomatis dan bisa Anda ubah. Panel **Total** langsung diperbarui saat Anda mengetik. Buka tagihan dari halaman acara untuk mengubah atau menghapusnya.

## Fitur: Siapa memesan apa
Untuk setiap item, pilih:
- **Semua orang**: semua orang dalam acara menanggung sama rata.
- **Pilih orang**: pilih siapa yang memesan dan berapa banyak, misalnya 3 porsi sate → Ana 2, Budi 1. Boleh setengah.
- **Per porsi**: setiap porsi punya kelompok orangnya sendiri. Contoh: 2 pizza seharga Rp 30.000. Ana dan Budi berbagi pizza pertama, sedangkan Citra, Dedi dan Eka berbagi pizza kedua. Pilih **Per porsi**, lalu di **Porsi ke-1** centang Ana dan Budi, dan di **Porsi ke-2** centang Citra, Dedi dan Eka. Ana dan Budi masing-masing membayar Rp 15.000, dan tiga lainnya Rp 10.000. **Semua** mencentang semua orang di porsi itu. Per porsi bisa dipakai jika jumlahnya bilangan bulat 1 sampai 50.

**Pajak, layanan, dan diskon:** pilih apakah dibagi **sesuai pesanan masing-masing** (lebih adil) atau **sama rata**.

**Pembulatan:** jika struk punya baris pembulatan, tambahkan biaya **Pembulatan**. Nilainya bisa negatif (mis. −200) atau positif. Pembaca foto akan mengisinya otomatis jika baris itu terbaca. Pembulatan dihitung setelah pajak dan dibagi dengan cara yang sama seperti biaya lainnya.

## Fitur: Ringkasan dan pelunasan
Buka **Ringkasan** untuk melihat item setiap orang, bagian biaya tambahan, total, dan yang sudah dibayar.

Di bawahnya, **Tagihan** menampilkan setiap tagihan. Ketuk salah satu untuk membukanya dan melihat:
- foto struk;
- setiap item dengan cara pembagiannya (**Semua orang**, **Pilih orang** atau **Per porsi**) dan berapa yang dibayar tiap orang. Item per porsi juga menampilkan siapa yang berbagi tiap porsi;
- pajak, layanan, diskon dan total;
- total tiap orang untuk tagihan itu.

Teman yang membuka tautan berbagi Anda melihat bagian Tagihan yang sama, jadi semua orang bisa memeriksa pembagiannya.

Ada dua cara pelunasan:
- **Per tagihan**: setiap orang membayar ke orang yang membayar tagihan tersebut.
- **Nett (bersih)**: utang saling mengurangi antar tagihan, sehingga transfer lebih sedikit. Contoh: Ana membayar makan siang dan Budi membayar makan malam. Alih-alih saling transfer, cukup selisihnya saja yang dikirim.

## Fitur: Ekspor dan bagikan
- **Excel**: unduh ringkasan dalam bentuk spreadsheet.
- **Gambar**: membuat gambar ringkasan. Klik **Gambar**, lalu pilih:
  - **Salin gambar**, lalu tempel langsung di WhatsApp, Telegram atau email. Tidak ada file yang tersimpan di perangkat.
  - **Bagikan…** (di ponsel), yang membuka menu berbagi ponsel untuk mengirim ke chat, email dan sebagainya.
  - **Unduh gambar**, yang menyimpannya sebagai file PNG.
- **Tautan berbagi**: klik **Bagikan**, lalu **Buat tautan**, dan salin. Siapa pun yang punya tautan bisa **melihat** (bukan mengubah) ringkasan.
  - Tambahkan **kode akses** (4–32 karakter), dan pembuka tautan cukup memasukkannya sekali per perangkat. Setelah 5 kali salah, tautan dikunci 15 menit.
  - Hapus centang **Tautan aktif** untuk mematikan tautan kapan saja.
  - Hapus centang **Tampilkan foto struk** untuk menyembunyikan foto dari tautan (secara bawaan foto ditampilkan). Struk bisa memuat nomor kartu atau alamat. Pembuka tautan tetap melihat item dan siapa yang berbaginya.

## Tanya jawab
- **Kenapa satu orang Rp 3.334 dan lainnya Rp 3.333?** Uang tidak bisa dibagi ke pecahan rupiah. Kelebihan satu rupiah diberikan ke satu orang, sehingga total selalu sama persis dengan struk.
- **Apakah teman bisa mengubah tagihan?** Tidak. Tautan berbagi hanya untuk dilihat.
- **Lupa kode akses?** Pembuat acara bisa membuat kode baru.

## Kontak bantuan
Hubungi administrator aplikasi (akan diisi).
