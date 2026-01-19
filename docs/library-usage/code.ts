// @ts-nocheck
/**
 * Example: Using @digimakers/core as a library
 *
 * This demonstrates how to use the PDF generator programmatically
 * instead of through the CLI.
 */

import {
  createPdfGenerator,
  startServer,
  stopServer,
  parseDocx,
  type ParsedLesson,
  type PdfGeneratorInstance,
  type ServerInstance,
  sampleLessonData,
} from '@digimakers/core';

async function generateFromDocx() {
  // Step 1: Start the server
  const server: ServerInstance = await startServer();
  console.log(`Server started at ${server.url}`);

  try {
    // Step 2: Create a PDF generator instance
    const generator: PdfGeneratorInstance = await createPdfGenerator(server.url);

    // Step 3: Parse a .docx file to get lesson data
    const { data: lessonData } = await parseDocx('./my-lesson.docx');

    // Step 4: Generate the PDF
    const pdfPath = await generator.generatePdf(lessonData, {
      outputDir: './custom-output',
      filename: 'my-custom-lesson',
    });

    console.log(`PDF generated successfully: ${pdfPath}`);

    // Step 5: Close the generator
    await generator.close();
  } finally {
    // Step 6: Stop the server
    await stopServer(server);
    console.log('Server stopped');
  }
}

async function generateWithCustomData() {
  const server: ServerInstance = await startServer();

  try {
    const generator: PdfGeneratorInstance = await createPdfGenerator(server.url);

    // You can also provide lesson data directly
    const lessonData: ParsedLesson = sampleLessonData;

    const pdfPath = await generator.generatePdf(lessonData, {
      outputDir: './output',
      filename: 'score-counter-lesson',
    });

    console.log(`PDF generated: ${pdfPath}`);
    await generator.close();
  } finally {
    await stopServer(server);
  }
}

// Run the examples
generateFromDocx().catch(console.error);
