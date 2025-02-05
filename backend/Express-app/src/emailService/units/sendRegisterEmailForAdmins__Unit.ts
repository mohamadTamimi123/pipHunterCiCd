import {transport} from "../email";
import Queue from "bull";

const sender = {
    address: "hello@example.com",
    name: "Mailtrap Test",
};
const recipients = [
    "admins@gmail.com",
];

const emailQueue = new Queue('emailQueue');



emailQueue.process(async (job) => {




    const { to, subject, text } = job.data;

    try {
        // ارسال ایمیل
        await transport.sendMail({
            from: sender,
            to: to,
            subject:String(subject),
            text: String(text),
            category: "Integration Test",
            sandbox: true
        });
        console.log(`Email sent to test`);
    } catch (error) {
        console.error(`Failed to send email to test`, error);
    }



});



export {emailQueue}

