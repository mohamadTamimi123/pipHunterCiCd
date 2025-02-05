

import express from "express";


import {getAllTicket, getTicket, getUserTicket, newTicket} from "../controller/Ticket.controllers";



const ticketRoute = express.Router();


ticketRoute.post('/tickets', newTicket);

ticketRoute.get('/tickets/user-ticket', getUserTicket);

ticketRoute.get('/all-tickets', getAllTicket);

// روت برای دریافت یک تیکت خاص با شناسه
// ticketRoute.get('/tickets/:id', async (req, res) => {
//     const { id } = req.params;
//
//     try {
//         const ticket = await Ticket.findById(id);
//         if (!ticket) {
//             return res.status(404).json({ error: 'Ticket not found' });
//         }
//         res.status(200).json(ticket);
//     } catch (err) {
//         res.status(500).json({ error: 'Error fetching ticket' });
//     }
// });

// روت برای به‌روزرسانی وضعیت یک تیکت
// ticketRoute.put('/tickets/:id', async (req, res) => {
//     const { id } = req.params;
//     const { status } = req.body; // وضعیت جدید
//
//     try {
//         const ticket = await Ticket.findById(id);
//         if (!ticket) {
//             return res.status(404).json({ error: 'Ticket not found' });
//         }
//
//         // به‌روزرسانی وضعیت تیکت
//         ticket.status = status || ticket.status;
//         const updatedTicket = await ticket.save();
//         res.status(200).json(updatedTicket);
//     } catch (err) {
//         res.status(500).json({ error: 'Error updating ticket status' });
//     }
// });

// روت برای حذف تیکت
// ticketRoute.delete('/tickets/:id', async (req, res) => {
//     const { id } = req.params;
//
//     try {
//         const ticket = await Ticket.findById(id);
//         if (!ticket) {
//             return res.status(404).json({ error: 'Ticket not found' });
//         }
//
//         await ticket.remove();
//         res.status(200).json({ message: 'Ticket deleted successfully' });
//     } catch (err) {
//         res.status(500).json({ error: 'Error deleting ticket' });
//     }
// });

export { ticketRoute }