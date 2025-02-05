
// ایجاد صف کارها
import Queue from "bull";

const emailQueue = new Queue('email-queue', 'redis://localhost:6379');




// تعریف worker برای پردازش کارها
emailQueue.process(async (job) => {
    const { to, subject, text } = job.data;
    const mailOptions = {
        from: 'your_email@gmail.com',
        to: to,
        subject: subject,
        text: text
    };

    try {
        await transport.sendMail(mailOptions);
        console.log('ایمیل با موفقیت ارسال شد.');
    } catch (error) {
        console.error('خطا در ارسال ایمیل:', error);
        // در اینجا می توانید خطا را handle کنید
    }
});


// افزودن یک کار به صف
emailQueue.add({
    to: 'recipient@example.com',
    subject: 'موضوع ایمیل',
    text: 'متن ایمیل'
});




import {transport} from "../email";

const sender = {
    address: "hello@example.com",
    name: "Mailtrap Test",
};
const recipients = [
    "mtamimipoor@gmail.com",
];



export function sendOtpLogin__Unit(val:any , email : any){

    transport
        .sendMail({
            from: sender,
            to: [email],
            subject: "You are awesome!",
            text: `code is : ${val}`,
            category: "Integration Test",
            sandbox: true
        })
        .then(console.log, console.error);



}