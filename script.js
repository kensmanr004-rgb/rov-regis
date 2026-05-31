document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rovRegistrationForm');
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // --- เปลี่ยน URL ตรงนี้ด้วยลิงก์ที่ได้จาก Google Apps Script ---
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxx1B6DsmWvm_E2bKqYaB--vmVPaOnVLpc2mg2tbbSXnaPcq93UcE0gBFI5aGMNbBevKA/exec';

    // จัดการ visual states เมื่อมีการกรอกข้อมูล
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

    // ดักจับการกดปุ่ม Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let isFormValid = true;

        // ตรวจสอบความถูกต้องของฟิลด์ที่บังคับ (Required)
        inputs.forEach(input => {
            if (input.value.trim() === "") {
                isFormValid = false;
                input.parentElement.classList.add('invalid');
            } else {
                input.parentElement.classList.remove('invalid');
            }
        });

        // หากไม่ผ่านการตรวจสอบ ให้เลื่อนจอไปที่จุดที่ผิดพลาด
        if (!isFormValid) {
            const firstInvalid = form.querySelector('.form-group.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // --- เริ่มต้นกระบวนการส่งข้อมูล ---
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true; // ป้องกันการกดซ้ำ
        btnSubmit.innerHTML = '<span>กำลังส่งข้อมูล...</span>';

        try {
            // ดึงข้อมูลจากฟอร์ม
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // ส่งข้อมูลไปยัง Google Sheets
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // จำเป็นสำหรับการเชื่อมต่อกับ Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // หากสำเร็จ
            openModal();
            form.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ กรุณาลองใหม่อีกครั้ง');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>ยืนยัน ROSTER</span> <i class="fa-solid fa-shield-halved"></i>';
        }
    });

    // --- ฟังก์ชันจัดการ Modal ---
    function openModal() {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    function closeModal() {
        successModal.classList.remove('active');
        document.body.style.overflow = ''; 
    }

    closeModalBtn.addEventListener('click', closeModal);

    // ปิด Modal หากคลิกพื้นที่ว่างด้านนอก
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            closeModal();
        }
    });
});