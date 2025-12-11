# Copilot Project Instructions (Lilith Reports)

Node.js/TypeScript microservice for document generation - part of the Lilith ERP ecosystem. Converts DOCX/Excel templates into populated documents with QR code support and PDF conversion.

## Quick Start Reference

**Stack**: Node.js + TypeScript + Express + Carbone (templating) + CloudConvert (PDF conversion)  
**Structure**: Single Express app with service-based architecture  
**Templates**: DOCX/ODT/XLS/XLSX files in `templates/` populated via Carbone engine  
**Output**: Generated files in `reports/` (auto-cleaned after 24h)  
**Integration**: Consumed by lilith-backend via REST API

## Dev Workflow

```bash
npm install              # Install dependencies
npm run dev              # Start with hot reload (tsx watch)
npm run build            # Compile TypeScript to build/
npm run start            # Run compiled JS (production)
```

**Environment**: Create `.env` with required variables:

```env
PORT=3000                            # Server port
TEMPLATES_PATH=./templates           # Template directory
CLOUD_CONVERT_API_KEY=your_key       # CloudConvert API key (for PDF)
```

**Docker**: Use provided Dockerfile - automatically creates `reports/` directory  
**Dependencies**: Carbone (DOCX/Excel generation), CloudConvert (PDF conversion), docx-templates (QR processing), node-cron (cleanup job)

## Architecture Overview

### Service Layer Pattern

All document processing logic is encapsulated in static service classes in `src/services/`:

1. **TemplateValidatorService**: Validates template existence and format (DOCX/ODT/XLS/XLSX)
2. **DocxGeneratorService**: Populates DOCX/ODT templates using Carbone engine with Spanish locale
3. **ExcelGeneratorService**: Populates Excel templates (.xls/.xlsx) using Carbone engine with Spanish locale
4. **QrProcessorService**: Post-processes DOCX to embed QR codes using docx-templates (DOCX only)
5. **PdfConverterService**: Converts DOCX to PDF via CloudConvert API (DOCX only)
6. **DocxToPdfConverter**: Low-level CloudConvert job orchestration

**Key Pattern**: All services use static methods - no instance state needed

### Request Flow (POST /download)

```typescript
Client Request → Express Handler → Template Parser → Service Pipeline → Response Download

Pipeline steps:
1. TemplateValidatorService.validate() - Check template exists and format is supported
2. TemplateValidatorService.isExcelTemplate() - Detect if Excel template
3. DocxGeneratorService.generate() OR ExcelGeneratorService.generate() - Populate template
4. QrProcessorService.process() - Add QR code (DOCX only, if qrCodeUrl provided)
5. PdfConverterService.convert() - Convert to PDF (DOCX only, if format === "pdf")
6. response.download() - Stream file to client
```

**Request body structure**:

```typescript
{
  reportName: string; // Template filename (e.g., "SalesOrder.docx")
  fileName: string; // Output filename (e.g., "order-12345.docx")
  data: object; // Template data + optional qrCodeUrl field
  format: string; // "pdf" or "docx"
}
```

### Template Processing (Carbone)

Templates use Carbone syntax for data binding:

- **Variables**: `{d.customerName}` - simple field access
- **Iterations**: `{d.items[i].name}` - loop over arrays
- **Formatters**: `{d.price:formatC('es-ES')}` - locale formatting
- **Conditionals**: `{d.status:ifEQ('approved'):show('✓')}` - conditional display

**Template location**: `templates/` directory (Budget.docx, DeliveryNote.docx, PurchaseOrder.docx, SalesInvoice.docx, SalesOrder.docx, WorkOrder.xls)  
**Locale**: Always set to `es-es` in both DocxGeneratorService and ExcelGeneratorService options

### Excel Template Support

The service fully supports Excel templates (.xls and .xlsx) using Carbone:

**Key differences from DOCX processing**:

- **No QR code support**: Excel templates skip QR processing (QR is DOCX-only feature)
- **No PDF conversion**: Excel files are delivered as-is (.xls or .xlsx) - PDF conversion only available for DOCX
- **Format preservation**: Carbone automatically maintains the original template format (xls vs xlsx)
- **Same Carbone syntax**: Excel templates use identical data binding syntax as DOCX templates

**Template detection**: `TemplateValidatorService.isExcelTemplate()` checks file extension to route to `ExcelGeneratorService`

**Excel-specific considerations**:

- Use Carbone's `formatN()` for numeric formatting in cells
- Arrays iterate across rows automatically with `{d.items[i].column}`
- Conditional formatting available via Carbone's show/hide directives
- Cell formulas in templates are preserved and can reference populated data

### QR Code Integration (DOCX Only)

QR codes use a **two-phase processing approach**:

1. **Template placeholder**: Must include special marker in DOCX template using `+++IMAGE qrCodeData+++` syntax (NOT Carbone syntax)
2. **Post-processing**: After Carbone generates the document, `QrProcessorService` replaces the marker with actual QR code image

**QR code configuration**:

- Size: 500x500px (displays as 2cm x 2cm in document)
- Format: PNG buffer
- Error correction: Level M (medium)
- Delimiter: `+++` (different from Carbone's `{d.}`)

**Conditional QR**: Only processes if `data.qrCodeUrl` is provided and non-empty

### PDF Conversion (CloudConvert API)

Uses CloudConvert's job-based API with three-task workflow:

1. **import/upload**: Upload DOCX to CloudConvert
2. **convert**: Convert DOCX → PDF
3. **export/url**: Download converted PDF

**DocxToPdfConverter orchestration**:

- Creates job with all tasks in single API call
- Uploads file via multipart/form-data to signed URL
- Polls job status until completion (`cloudConvert.jobs.wait()`)
- Downloads result from export task URL
- Streams to local filesystem

**Error handling**: Logs CloudConvert API errors with response data for debugging

## Background Services

### Cleanup Job (cleanup-job.ts)

**Auto-imported on app startup** - runs immediately on boot, then scheduled via node-cron:

- **Schedule**: Every day at midnight (`0 0 * * *`)
- **Target**: `reports/` directory
- **Logic**: Deletes files older than 24 hours based on `mtimeMs` (modification time)
- **Purpose**: Prevent disk space exhaustion from generated reports

**Critical**: Job module must be imported in `app.ts` for side effects (no exports needed)

## Error Handling Pattern

### Centralized Error Responses (template-parser.ts)

```typescript
try {
  // Service pipeline
} catch (err) {
  if (err instanceof Error) {
    if (err.message.includes("Template file not found")) {
      response.status(404).end(`Template not found: ${err.message}`);
    } else if (err.message.includes("Unsupported template format")) {
      response.status(400).end(`Unsupported format: ${err.message}`);
    } else {
      response.status(500).end(`Template generation failed: ${err.message}`);
    }
  }
}
```

**Service error conventions**:

- Throw descriptive `Error` objects (not strings)
- Include context in error messages (e.g., file paths, template names)
- Use specific error text for pattern matching in handler

**HTTP status mapping**:

- 400: Client errors (missing params, unsupported formats)
- 404: Template not found
- 500: Processing failures (Carbone, CloudConvert, filesystem)

## File System Conventions

### Directory Structure

```
src/
  app.ts                 # Express app + /download endpoint
  routes/
    template-parser.ts   # Request handler & error orchestration
  services/
    *.service.ts         # Business logic (static methods)
    docx-to-pdf.converter.ts  # CloudConvert integration
  jobs/
    cleanup-job.ts       # Cron-based file cleanup
  utils/
    env.ts              # Environment variable validation

templates/              # Input DOCX/ODT templates
reports/                # Generated outputs (auto-cleaned)
build/                  # Compiled JavaScript (gitignored)
```

### Template Naming

Templates match business entities from lilith-backend:

- `Budget.docx` → Presupuestos
- `SalesOrder.docx` → Pedidos de venta
- `DeliveryNote.docx` → Albaranes de entrega
- `SalesInvoice.docx` → Facturas de venta
- `PurchaseOrder.docx` → Pedidos de compra
- `WorkOrder.xls` → Órdenes de fabricación (legacy Excel format)

**Integration**: Backend sends `reportName` matching these filenames

## Environment Configuration (env.ts)

**Validation-first approach**: App crashes on startup if required vars missing

```typescript
const getEnvVar = (key: string, required = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(
      `❌ The environment variable ${key} is required and not defined.`
    );
  }
  return value || "";
};
```

**Required vars**: `PORT`  
**Optional vars**: `TEMPLATES_PATH`, `CLOUD_CONVERT_API_KEY` (defaults to empty string if missing)

**dotenv setup**: Loads from `../../.env` (root of monorepo structure)

## Integration with Lilith Backend

### Backend Consumption Pattern

Backend calls POST `/download` after generating report data:

```csharp
// C# backend example (from lilith-backend)
var reportData = await service.GetReportDataById(orderId);
var httpClient = new HttpClient { BaseAddress = new Uri("http://lilith-reports:3000") };
var response = await httpClient.PostAsJsonAsync("/download", new {
    reportName = "SalesOrder.docx",
    fileName = $"pedido-{orderNumber}.pdf",
    data = reportData,
    format = "pdf"
});
var pdfBytes = await response.Content.ReadAsByteArrayAsync();
```

**Health Check**: GET `/health` returns 200 OK (no body) - used for container orchestration

### Data Contract

No formal DTO validation - assumes backend sends correct structure. Key expectations:

- `data` object matches template variable structure (`{d.fieldName}`)
- `qrCodeUrl` is optional string in `data` object
- `reportName` includes extension (.docx, .odt, .xls, or .xlsx)
- `fileName` can omit extension (auto-detects based on template type)

## Development Guidelines

### Adding New Templates

**For DOCX/ODT templates**:

1. Create template with Carbone syntax in `templates/`
2. Add QR placeholder `+++IMAGE qrCodeData+++` if QR support needed
3. Test with format="pdf" for PDF conversion capability
4. Update backend to send matching `reportName` value

**For Excel templates (.xls/.xlsx)**:

1. Create Excel template with Carbone syntax in `templates/`
2. Use `formatN()` for numeric cell formatting, `formatD()` for dates
3. Remember: No QR code or PDF conversion support for Excel
4. Test array iterations across rows
5. Update backend to send matching `reportName` value (include .xls or .xlsx extension)

### Service Extension Pattern

When adding new processing capabilities:

```typescript
export class NewProcessorService {
  /**
   * Brief description of what this processes.
   * @param inputPath - Path to input file
   * @param options - Processing options
   */
  static async process(inputPath: string, options: Options): Promise<void> {
    // Implementation
    console.log("Processing completed:", inputPath);
  }
}
```

**Conventions**:

- Static methods only (no instance state)
- JSDoc comments required
- Console logging for observability
- Throw descriptive errors for failures

### Error Handling Best Practices

- **Service layer**: Throw `Error` objects with descriptive messages
- **Route layer**: Catch and map to HTTP status codes
- **Console logging**: Log errors before throwing/responding
- **Client errors**: Return plain text error messages (not JSON)

### TypeScript Configuration

- **Target**: ES6 (Node.js compatibility)
- **Module**: CommonJS (required for Carbone and CloudConvert SDKs)
- **Output**: `build/` directory
- **Source maps**: Enabled for debugging

## Common Anti-Patterns to Avoid

**DON'T**:

- Mix Carbone `{d.}` syntax with docx-templates `+++` syntax in same processing step
- Store generated files indefinitely (cleanup job exists for a reason)
- Use QR codes without checking `qrCodeUrl` existence (wastes processing time)
- Return JSON error responses (Express default) - use plain text for consistency
- Add instance methods to service classes (breaks current static pattern)

**DO**:

- Validate template existence before processing
- Use descriptive error messages matching centralized error handler patterns
- Log processing steps for debugging (console.log is acceptable in services)
- Follow existing naming conventions for templates and services
- Respect CloudConvert API limits (consider rate limiting for high-volume usage)

## Deployment Considerations

**Docker**:

- Alpine Node.js base image for minimal size
- Creates `reports/` directory in container
- Exposes port 80 (configure via PORT env var)
- Builds from source (includes TypeScript compilation)

**Production checklist**:

- Set `CLOUD_CONVERT_API_KEY` environment variable
- Configure `TEMPLATES_PATH` if templates mounted from volume
- Ensure `reports/` directory is writable
- Monitor disk usage (cleanup job should prevent issues)
- Consider reverse proxy for HTTPS (app serves HTTP only)

**Performance**:

- CloudConvert conversion takes 2-10s depending on document complexity
- QR generation adds ~100-500ms
- Template rendering (Carbone) typically <1s
- Bottleneck is usually PDF conversion (external API dependency)
