# Flipkart Label Crop Engine — STABLE & FROZEN DIRECTIVE

The Flipkart Label Crop processing engine is production-stable and has been validated with 90+ label batches.

## Rules & Invariants:
1. **DO NOT MODIFY PROCESSING LOGIC**: Do NOT change, refactor, optimize, rewrite, replace, or remove any existing Flipkart processing code or logic in `/src/utils/flipkartEngine.ts`, `/src/utils/flipkartStorage.ts`, or any calculation/detection routines.
2. **FREEZE ALL PROCESSING PARAMETERS**:
   - PDF upload, parsing, and A4 page handling.
   - Automatic shipping-label detection and candidate search algorithms.
   - Crop boundary calculations, default crop coordinates, and X/Y/W/H crop geometry.
   - White-space handling and top/left/right/bottom boundary detection.
   - Manual crop functionality and "Apply & Process Crop".
   - Multi-page and 90+ label batch processing.
   - PDF rendering, embedding, and PDF generation with 1:1 vector resolution.
   - Output page geometry, label aspect ratio, and printer compatibility.
   - Barcode, QR-code, text, and vector graphics preservation.
   - Dedicated customer message band logic (clearance, placement below label, no overlay/overlap).
   - Direct Print and PDF download behavior.
3. **SCOPE OF FUTURE CHANGES**:
   - Only customer-facing UI presentation adjustments are permitted.
   - Any future UI change must remain strictly isolated from the Flipkart processing engine.
   - Modify processing logic ONLY if explicitly and unambiguously instructed by the user in a future prompt.
