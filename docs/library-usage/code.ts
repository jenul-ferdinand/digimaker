// @ts-nocheck
/**
 * Example: Using digimaker-cli as a library
 *
 * This demonstrates how to use the PDF generator programmatically
 * instead of through the CLI.
 */

import {
  createPdfGenerator,
  startServer,
  stopServer,
  type LessonData,
  type PdfGeneratorInstance,
  type ServerInstance
} from 'digimaker-cli';

async function generateCustomPdf() {
  // Step 1: Start the server
  const server: ServerInstance = await startServer();
  console.log(`Server started at ${server.url}`);

  try {
    // Step 2: Create a PDF generator instance
    const generator: PdfGeneratorInstance = await createPdfGenerator(server.url);

    // Step 3: Define your lesson data
    const lessonData: LessonData = {
      id: 'CUSTOM-001',
      title: 'My Custom Lesson',
      generatedAt: new Date().toLocaleDateString('en-GB'),
      paragraphs: [
        'This is a custom lesson generated programmatically.',
        'You can integrate this into your existing application.',
        'No CLI needed - just function calls!',
      ],
    };

    // Step 4: Generate the PDF
    const pdfPath = await generator.generatePdf(lessonData, {
      outputDir: './custom-output',
      filename: 'my-custom-lesson',
    });

    console.log(`PDF generated successfully: ${pdfPath}`);

    // Step 5: Generate multiple PDFs in batch
    const batchResults = await generator.generateBatch([
      {
        data: { ...lessonData, title: 'Lesson 1' },
        options: { outputDir: './batch-output', filename: 'lesson-1' },
      },
      {
        data: { ...lessonData, title: 'Lesson 2' },
        options: { outputDir: './batch-output', filename: 'lesson-2' },
      },
    ]);

    console.log(`Batch generated: ${batchResults.length} PDFs`);

    // Step 6: Close the generator
    await generator.close();
  } finally {
    // Step 7: Stop the server
    await stopServer(server);
    console.log('Server stopped');
  }
}

// Run the example
generateCustomPdf().catch(console.error);
