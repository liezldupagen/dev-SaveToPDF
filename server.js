require('express-async-errors');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const { PDFDocument, StandardFonts } = require('pdf-lib');

const app = express();

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Create the report directory if it doesn't exist
const dir = './report';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

app.post('/submit', async (req, res) => {
    try {
        // Validate form field
        if (!req.body.patient_name) {
            return res.status(400).send('Invalid form data');
        }

        // Load a PDF with form fields
        const formPdfBytes = fs.readFileSync('template.pdf');
        const pdfDoc = await PDFDocument.load(formPdfBytes);

        // Get the form fields
        const form = pdfDoc.getForm();

        // Get a specific field by its name and fill it with data
        const fields = form.getFields();
        let count = 0;
        fields.forEach(field => {
            console.log(field.getName());
            count++;
        });
        console.log('Total fields: ', count);

        const patientNameField = form.getTextField('patient_name');
        const dobField = form.getTextField('p1_dob');
        const physicianField = form.getTextField('p1_physician');
        const primaryField = form.getTextField('p1_primary');
        const secondaryField = form.getTextField('p1_secondary');
        const tertiaryField = form.getTextField('p1_teriary');
        const houseField = form.getCheckBox('p1_house');
        const condotownhomeField = form.getCheckBox('p1_condotownhome');
        const yesField = form.getRadioGroup('p1_driveWheelchairYes');

        patientNameField.setText(req.body.patient_name);
        dobField.setText(req.body.p1_dob);
        physicianField.setText(req.body.p1_physician);
        primaryField.setText(req.body.p1_primary);
        secondaryField.setText(req.body.p1_secondary);
        tertiaryField.setText(req.body.p1_teriary);
        // Check the checkbox
        houseField.check(req.body.p1_house);
        condotownhomeField.check(req.body.p1_condotownhome);
        // Or uncheck the checkbox
        // checkBoxField.uncheck();
        // Get a specific radio group field by its name
        yesField.select('drive in chair yes');

        // Flatten the form fields (makes them uneditable)
        form.flatten();

        // Save the filled PDF
        const pdfBytes = await pdfDoc.save();
        const filename = `filled_${Date.now()}_${req.body.patient_name}.pdf`; // Unique filename
        fs.writeFileSync(`report/${filename}`, pdfBytes);

        // Redirect to the filled PDF
        res.redirect(`/report/filled-pdf/${filename}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

app.get('/report/filled-pdf/:filename', (req, res) => {
    res.sendFile(`${__dirname}/report/${req.params.filename}`);
});

app.listen(4000, () => console.log('Server started on port 4000'));
