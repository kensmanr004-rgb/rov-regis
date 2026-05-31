document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rovRegistrationForm');
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // ⚠️ อย่าลืม! นำ URL ล่าสุดที่ได้จากการ Deploy Web App บน Google Apps Script มาแทนที่ลิงก์ด้านล่างนี้
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxx1B6DsmWvm_E2bKqYaB--vmVPaOnVLpc2mg2tbbSXnaPcq93UcE0gBFI5aGMNbBevKA/exec';

    // ดึงเฉพาะช่องข้อมูลที่ตั้งค่าบังคับกรอก (required) เพื่อทำระบบแจ้งเตือนสีแดง
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        // ลบสถานะ error ออกเมื่อผู้ใช้เริ่มพิมพ์แก้ไขข้อมูล
        input.addEventListener('input', () => {
            if (input.value.trim() !== "") {
                input.parentElement.classList.remove('invalid');
            }
        });

        // ตรวจสอบข้อมูลเมื่อผู้ใช้คลิกออกจากช่อง input (blur event)
        input.addEventListener('blur', () => {
            if (input.value.trim() === "") {
                input.parentElement.classList.add('invalid');
            } else {
                input.parentElement.classList.remove('invalid');
            }
        });
    });

    // ดักจับจังหวะการกดปุ่ม Submit ฟอร์ม
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let isFormValid = true;

        // ตรวจสอบความถูกต้องของฟิลด์ที่บังคับ (Required) ทั้งหมดอีกครั้งก่อนส่ง
        inputs.forEach(input => {
            if (input.value.trim() === "") {
                isFormValid = false;
                input.parentElement.classList.add('invalid');
            } else {
                input.parentElement.classList.remove('invalid');
            }
        });

        // หากตรวจเจอจุดว่าง ให้เลื่อนหน้าจอไปยังจุดที่ลืมกรอกจุดแรกทันทีแบบนุ่มนวล
        if (!isFormValid) {
            const firstInvalid = form.querySelector('.form-group.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // --- เริ่มต้นกระบวนการส่งข้อมูลไปยัง Google Sheets ---
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true; // ป้องกันการกดเบิ้ลส่งข้อมูลซ้ำ
        btnSubmit.innerHTML = '<span>กำลังส่งข้อมูล...</span>';

        try {
            // ดึงข้อมูลทั้งหมดจากช่อง input ในฟอร์มแบบอัตโนมัติ
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // ยิงข้อมูล POST ไปยัง Google Apps Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // สำคัญมาก: ป้องกันเบราว์เซอร์บล็อกปัญหา CORS
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // หากทำงานสำเร็จ: เปิดหน้าต่างแจ้งเตือนโหมด Popup และทำการเคลียร์ฟอร์ม
            openModal();
            form.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล กรุณาลองใหม่อีกครั้ง');
        } finally {
            // คืนค่าปุ่มยืนยันให้กลับมาเป็นปกติ
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>ยืนยัน ROSTER</span> <i class="fa-solid fa-shield-halved"></i>';
        }
    });

    // --- ฟังก์ชันจัดการเปิด-ปิด Modal ---
    function openModal() {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    function closeModal() {
        successModal.classList.remove('active');
        document.body.style.overflow = ''; 
    }

    closeModalBtn.addEventListener('click', closeModal);

    // ปิดหน้าต่าง Popup หากคลิกพื้นที่ว่างด้านนอกกล่องข้อความ
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            closeModal();
        }
    });
});
