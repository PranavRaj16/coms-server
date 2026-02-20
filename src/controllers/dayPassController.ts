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

        // PDF Design System - Matching the new Premium Blue Theme
        const colors = {
            primary: '#2563EB', // Blue 600
            secondary: '#1E40AF', // Blue 800
            slate: '#0F172A',
            muted: '#64748B',
            lightMuted: '#94A3B8',
            border: '#E2E8F0',
            bg: '#FFFFFF',
            cardBg: '#F8FAFC'
        };

        const pageWidth = 420; // A5 width
        const pageHeight = 595; // A5 height
        const centerX = pageWidth / 2;

        // Background
        doc.rect(0, 0, pageWidth, pageHeight).fill(colors.bg);

        // Outer Border
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40).strokeColor(colors.border).lineWidth(0.5).stroke();

        // 1. Header Section
        // Logo Placeholder/Text
        doc.fillColor(colors.slate);
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('Cohort', 40, 45, { continued: true });
        doc.fillColor(colors.muted).font('Helvetica').text('Ecosystem');

        doc.fillColor(colors.lightMuted)
            .fontSize(8)
            .font('Helvetica-Bold')
            .text('OFFICIAL GUEST ACCESS', 0, 50, { align: 'right', width: pageWidth - 60, characterSpacing: 1 });

        // Header Divider
        doc.moveTo(40, 80).lineTo(pageWidth - 40, 80).strokeColor(colors.border).lineWidth(0.5).stroke();

        // 2. Blue Main Header Card
        const cardX = 40;
        const cardY = 100;
        const cardW = pageWidth - 80;
        const cardH = 120;

        // Draw Card with Gradient
        const grad = doc.linearGradient(cardX, cardY, cardX + cardW, cardY);
        grad.stop(0, '#1E40AF').stop(1, '#3B82F6');

        doc.roundedRect(cardX, cardY, cardW, cardH, 8).fill(grad);

        // Card Content
        const cardMiddle = cardY + (cardH / 2);

        // "DAY PASS" with lines
        doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold');
        const dayPassText = "DAY PASS";
        const textWidth = doc.widthOfString(dayPassText);
        const lineLen = 80;

        doc.moveTo(centerX - (textWidth / 2) - lineLen - 10, cardY + 25)
            .lineTo(centerX - (textWidth / 2) - 10, cardY + 25)
            .strokeColor('rgba(255,255,255,0.3)').lineWidth(1).stroke();

        doc.moveTo(centerX + (textWidth / 2) + 10, cardY + 25)
            .lineTo(centerX + (textWidth / 2) + lineLen + 10, cardY + 25)
            .strokeColor('rgba(255,255,255,0.3)').lineWidth(1).stroke();

        doc.text(dayPassText, 0, cardY + 20, { align: 'center' });

        doc.fillColor('rgba(255,255,255,0.7)').fontSize(7).font('Helvetica-Bold').text('PASS ID', 0, cardY + 45, { align: 'center' });
        doc.fillColor('#FFFFFF').fontSize(28).font('Helvetica-Bold').text(passCode, 0, cardY + 65, { align: 'center' });

        // 3. Visitor Information (Rows)
        const infoY = cardY + cardH + 15;
        const colW = (pageWidth - 80) / 2;

        // Row 1: Visitor Name & Visit Date
        doc.fillColor(colors.muted).fontSize(7).font('Helvetica-Bold').text('VISITOR NAME', 40, infoY);
        doc.fillColor(colors.slate).fontSize(10).font('Helvetica-Bold').text(name, 40, infoY + 12, { width: colW - 10 });

        doc.fillColor(colors.muted).fontSize(7).font('Helvetica-Bold').text('VISIT DATE', 40 + colW + 10, infoY);
        doc.fillColor(colors.slate).fontSize(10).font('Helvetica-Bold').text(new Date(visitDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }), 40 + colW + 10, infoY + 12, { width: colW - 10 });

        // Row 2: Purpose of Visit
        const purposeY = infoY + 38;
        doc.fillColor(colors.muted).fontSize(7).font('Helvetica-Bold').text('PURPOSE OF VISIT', 40, purposeY);
        doc.fillColor(colors.slate).fontSize(10).font('Helvetica-Bold').text(`"${purpose}"`, 40, purposeY + 12, { width: pageWidth - 80 });

        // 4. Middle Section Divider
        const dividerY = purposeY + 42;
        doc.moveTo(40, dividerY).lineTo(pageWidth - 40, dividerY).strokeColor(colors.border).lineWidth(0.5).stroke();

        // "SCAN AT RECEPTION"
        const scanText = "SCAN AT RECEPTION";
        doc.fontSize(7).font('Helvetica-Bold');
        const scanTextW = doc.widthOfString(scanText);
        doc.fillColor(colors.muted).text(scanText, 0, dividerY + 15, { align: 'center' });

        doc.moveTo(40, dividerY + 20).lineTo(centerX - (scanTextW / 2) - 10, dividerY + 20).strokeColor(colors.border).lineWidth(0.5).stroke();
        doc.moveTo(centerX + (scanTextW / 2) + 10, dividerY + 20).lineTo(pageWidth - 40, dividerY + 20).strokeColor(colors.border).lineWidth(0.5).stroke();

        // 5. QR Code Area
        const qrSize = 130;
        const qrBoxY = dividerY + 45;

        // QR Container
        doc.roundedRect(centerX - (qrSize / 2) - 15, qrBoxY - 15, qrSize + 30, qrSize + 30, 8)
            .fill(colors.cardBg);

        doc.image(qrCodeData, centerX - (qrSize / 2), qrBoxY, {
            fit: [qrSize, qrSize]
        });

        // 6. Footer Disclaimer
        const footerY = pageHeight - 75;
        doc.fillColor(colors.muted)
            .fontSize(7)
            .font('Helvetica')
            .text('This pass is non-transferable and valid only for the date specified above.', 40, footerY, { align: 'center', width: pageWidth - 80 })
            .text('Access is subject to Cohort terms of service and security policies.', { align: 'center', width: pageWidth - 80 });

        // Bottom Website Link
        const webLink = "www.cohortwork.com";
        doc.fontSize(9).font('Helvetica-Bold');
        const webW = doc.widthOfString(webLink);
        doc.fillColor(colors.secondary).text(webLink, 0, pageHeight - 40, { align: 'center' });

        doc.moveTo(40, pageHeight - 35).lineTo(centerX - (webW / 2) - 10, pageHeight - 35).strokeColor(colors.border).lineWidth(0.5).stroke();
        doc.moveTo(centerX + (webW / 2) + 10, pageHeight - 35).lineTo(pageWidth - 40, pageHeight - 35).strokeColor(colors.border).lineWidth(0.5).stroke();

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
