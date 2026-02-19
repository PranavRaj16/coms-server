import { Request, Response } from 'express';
import DayPass from '../models/DayPass.js';
import sendEmail from '../utils/sendEmail.js';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';

export const requestDayPass = async (req: Request, res: Response) => {
    try {
        const { name, email, contact, purpose, visitDate } = req.body;

        if (!name || !email || !contact || !purpose || !visitDate) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const passCode = `COHORT-${uuidv4().substring(0, 8).toUpperCase()}`;

        const dayPass = await DayPass.create({
            name,
            email,
            contact,
            purpose,
            visitDate,
            passCode
        });

        // Generate QR Code
        const qrCodeData = await QRCode.toDataURL(passCode);

        // Generate PDF
        const doc = new PDFDocument({ size: 'A5', margin: 0 }); // Margin 0 because we're drawing custom shapes
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));

        const pdfPromise = new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });

        // PDF Design System
        const colors = {
            primary: '#0D9488',
            slate: '#0F172A',
            muted: '#64748B',
            border: '#E2E8F0',
            bg: '#FFFFFF'
        };

        // Page setup
        const pageWidth = 420; // A5 width
        const centerX = pageWidth / 2;

        // Background
        doc.rect(0, 0, 420, 595).fill(colors.bg);

        // Subtle Border
        doc.rect(20, 20, 380, 555).strokeColor(colors.border).lineWidth(0.5).stroke();

        // Header Section
        doc.fillColor(colors.primary)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('COHORT ECOSYSTEM', 0, 50, { align: 'center', characterSpacing: 1.5 });

        doc.fillColor(colors.slate)
            .fontSize(36)
            .font('Helvetica-Bold')
            .text('GUEST PASS', 0, 70, { align: 'center' });

        // Divider
        doc.moveTo(centerX - 40, 125).lineTo(centerX + 40, 125).strokeColor(colors.primary).lineWidth(2).stroke();

        // Information Blocks
        const labelY = 160;
        const valueY = 175;

        // Visitor Name (Left)
        doc.fillColor(colors.muted).fontSize(8).font('Helvetica-Bold').text('VISITOR NAME', 60, labelY);
        doc.fillColor(colors.slate).fontSize(14).font('Helvetica-Bold').text(name.toUpperCase(), 60, valueY);

        // Date (Right)
        doc.fillColor(colors.muted).fontSize(8).font('Helvetica-Bold').text('VISIT DATE', 250, labelY);
        doc.fillColor(colors.slate).fontSize(14).font('Helvetica-Bold').text(new Date(visitDate).toLocaleDateString(undefined, { dateStyle: 'medium' }).toUpperCase(), 250, valueY);

        // Second row
        const row2Y = 220;
        doc.fillColor(colors.muted).fontSize(8).font('Helvetica-Bold').text('PURPOSE OF ACCESS', 60, row2Y);
        doc.fillColor(colors.slate).fontSize(11).font('Helvetica').text(purpose, 60, row2Y + 15, { width: 300 });

        // QR Code Container
        const qrBoxSize = 180;
        const qrX = centerX - (qrBoxSize / 2);
        const qrY = 300;

        // Draw QR Border
        doc.roundedRect(qrX - 10, qrY - 10, qrBoxSize + 20, qrBoxSize + 20, 20)
            .strokeColor(colors.border)
            .lineWidth(1)
            .stroke();

        doc.image(qrCodeData, qrX, qrY, {
            fit: [qrBoxSize, qrBoxSize]
        });

        // Pass Code below QR
        doc.fillColor(colors.muted)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(passCode, 0, qrY + qrBoxSize + 25, { align: 'center', characterSpacing: 2 });

        // Footer Section
        doc.fillColor(colors.muted)
            .fontSize(8)
            .font('Helvetica')
            .text('This digital pass grants temporary access to Cohort facilities.', 0, 520, { align: 'center' });

        doc.fillColor(colors.slate)
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('PRESENT THIS AT RECEPTION FOR SCANNING', 0, 535, { align: 'center' });

        // Bottom Brand Mark
        doc.fillColor(colors.primary)
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('WWW.COHORTWORK.COM • POWERED BY COHORT ECOSYSTEM', 0, 560, { align: 'center' });

        doc.end();

        const pdfBuffer = await pdfPromise;


        // Send Email
        await sendEmail({
            email,
            subject: 'Your Cohort Day Pass',
            message: `
                <h1>Hello ${name},</h1>
                <p>Thank you for your interest in visiting Cohort Ecosystem. Attached to this email is your Day Pass for ${new Date(visitDate).toLocaleDateString()}.</p>
                <p><strong>Pass Code:</strong> ${passCode}</p>
                <p>Please present the attached QR code at the reception when you arrive.</p>
                <p>We look forward to seeing you!</p>
                <br/>
                <p>Best regards,<br/>Cohort Team</p>
            `,
            attachments: [
                {
                    filename: `DayPass-${passCode}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Day Pass generated and sent to email',
            data: dayPass
        });

    } catch (error: any) {
        console.error('Day Pass Error:', error);
        res.status(500).json({ message: error.message || 'Error generating day pass' });
    }
};

export const getAllDayPasses = async (req: Request, res: Response) => {
    try {
        const passes = await DayPass.find().sort({ createdAt: -1 });
        res.status(200).json(passes);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching day passes' });
    }
};

export const verifyDayPass = async (req: Request, res: Response) => {
    try {
        const { passCode } = req.params;

        if (!passCode) {
            return res.status(400).json({ message: 'Pass code is required' });
        }

        const pass: any = await DayPass.findOne({ passCode });

        if (!pass) {
            return res.status(404).json({ message: 'Day pass not found' });
        }

        if (pass.status === 'Used') {
            return res.status(400).json({
                message: 'This pass has already been used',
                data: pass
            });
        }

        if (pass.status === 'Expired') {
            return res.status(400).json({
                message: 'This pass has expired',
                data: pass
            });
        }

        // Check if date is valid (today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const visitDate = new Date(pass.visitDate);
        visitDate.setHours(0, 0, 0, 0);

        if (visitDate.getTime() !== today.getTime()) {
            const dateStr = visitDate.toLocaleDateString(undefined, { dateStyle: 'long' });
            return res.status(400).json({
                message: `This pass is valid for ${dateStr}, not today.`,
                data: pass
            });
        }

        // Mark as used
        pass.status = 'Used';
        await pass.save();

        res.status(200).json({
            success: true,
            message: 'Day pass authenticated successfully!',
            data: pass
        });

    } catch (error: any) {
        console.error('Verify Day Pass Error:', error);
        res.status(500).json({ message: error.message || 'Error verifying day pass' });
    }
};
