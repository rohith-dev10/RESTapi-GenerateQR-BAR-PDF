const express = require('express');
const QRCode = require('qrcode');
const BWIP = require('bwip-js');
const puppeteer = require('puppeteer');
const cors = require('cors');
const ExcelJS = require('exceljs');
const cheerio = require('cheerio');


const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the PDF Generator API!');
})

// Endpoint to generate QR code and return base64 image
app.post('/generateQR', async (req, res) => {
    console.log('Request received:', req.body);
    const { text } = req.body;

    try {
        const qrCode = await QRCode.toDataURL(text);
        res.json({ qrCode });
    } catch (err) {
        console.error('Error generating QR code:', err);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Endpoint to generate Barcode and return base64 image
app.post('/generateBarcode', async (req, res) => {
    console.log('Request received:', req.body);
    const { text } = req.body;

    try {
        BWIP.toBuffer({
            bcid: 'code128',  // Barcode type
            text: text,       // Text to encode
            scale: 3,         // Scaling factor
            height: 10,       // Barcode height, in millimeters
            includetext: true, // Show human-readable text below barcode
        }, function (err, png) {
            if (err) {
                console.error('Error generating barcode:', err);
                res.status(500).json({ error: 'Failed to generate barcode' });
            } else {
                const base64Image = Buffer.from(png).toString('base64');
                res.json({ barcode: base64Image });
            }
        });
    } catch (err) {
        console.error('Error generating barcode:', err);
        res.status(500).json({ error: 'Failed to generate barcode' });
    }
});

// Endpoint to generate PDF from HTML input
app.post('/generatePDF', async (req, res) => {
    const { html } = req.body;

    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle2' }); // Set HTML content
        await page.emulateMediaType('screen');
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        });
        await browser.close();

        // Send PDF as response
        res.contentType('application/pdf');
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.post('/generateExcel', async (req, res) => {
    const { html } = req.body;

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');

        // Parse the HTML table and add data to worksheet
        const $ = cheerio.load(html);
        const table = $('table');

        // Iterate over each row and cell in the HTML table and add to Excel worksheet
        table.find('tr').each((rowIndex, row) => {
            const rowData = [];
            $(row).find('td, th').each((cellIndex, cell) => {
                rowData.push($(cell).text());
            });
            worksheet.addRow(rowData);
        });

        // Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Set headers and send Excel file as response
        res.setHeader('Content-Disposition', 'attachment; filename=generated.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error('Error generating Excel:', err);
        res.status(500).json({ error: 'Failed to generate Excel' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
