/**
 * Extract the DateTimeOriginal (or DateTimeDigitized / DateTime) from a JPEG's EXIF data.
 * Returns a Date object if found, null otherwise.
 * Lightweight — no external dependencies.
 */
export async function extractExifDate(file: File): Promise<Date | null> {
  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Check for JPEG SOI marker
    if (view.getUint16(0) !== 0xFFD8) return null;

    let offset = 2;
    while (offset < view.byteLength - 1) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFE1) {
        // APP1 (EXIF) segment
        const segmentLength = view.getUint16(offset + 2);
        return parseExifSegment(view, offset + 4, segmentLength - 2);
      }
      // Skip other segments
      if ((marker & 0xFF00) !== 0xFF00) break;
      const len = view.getUint16(offset + 2);
      offset += 2 + len;
    }
    return null;
  } catch {
    return null;
  }
}

function parseExifSegment(view: DataView, start: number, length: number): Date | null {
  // "Exif\0\0"
  const exifHeader = String.fromCharCode(
    view.getUint8(start), view.getUint8(start + 1),
    view.getUint8(start + 2), view.getUint8(start + 3)
  );
  if (exifHeader !== "Exif") return null;

  const tiffStart = start + 6;
  const byteOrder = view.getUint16(tiffStart);
  const littleEndian = byteOrder === 0x4949; // "II"

  const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
  
  // Search IFD0 for ExifIFDPointer (tag 0x8769)
  const exifIfdOffset = findTag(view, tiffStart, tiffStart + ifdOffset, littleEndian, 0x8769);
  if (exifIfdOffset == null) {
    // Try reading DateTime (tag 0x0132) from IFD0 as fallback
    return readDateTag(view, tiffStart, tiffStart + ifdOffset, littleEndian, 0x0132);
  }

  // Search Exif IFD for DateTimeOriginal (0x9003), DateTimeDigitized (0x9004), or DateTime (0x0132)
  const absExifIfd = tiffStart + exifIfdOffset;
  return (
    readDateTag(view, tiffStart, absExifIfd, littleEndian, 0x9003) || // DateTimeOriginal
    readDateTag(view, tiffStart, absExifIfd, littleEndian, 0x9004) || // DateTimeDigitized
    readDateTag(view, tiffStart, tiffStart + ifdOffset, littleEndian, 0x0132) // DateTime from IFD0
  );
}

function findTag(view: DataView, tiffStart: number, ifdStart: number, le: boolean, targetTag: number): number | null {
  try {
    const count = view.getUint16(ifdStart, le);
    for (let i = 0; i < count; i++) {
      const entryOffset = ifdStart + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);
      if (tag === targetTag) {
        return view.getUint32(entryOffset + 8, le);
      }
    }
  } catch { /* bounds error */ }
  return null;
}

function readDateTag(view: DataView, tiffStart: number, ifdStart: number, le: boolean, targetTag: number): Date | null {
  try {
    const count = view.getUint16(ifdStart, le);
    for (let i = 0; i < count; i++) {
      const entryOffset = ifdStart + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);
      if (tag === targetTag) {
        const dataLength = view.getUint32(entryOffset + 4, le);
        const valueOffset = dataLength > 4
          ? tiffStart + view.getUint32(entryOffset + 8, le)
          : entryOffset + 8;
        
        // Read 19 bytes: "YYYY:MM:DD HH:MM:SS"
        let str = "";
        for (let j = 0; j < 19; j++) {
          str += String.fromCharCode(view.getUint8(valueOffset + j));
        }
        // Parse "YYYY:MM:DD HH:MM:SS" → Date
        const [datePart, timePart] = str.split(" ");
        if (!datePart || !timePart) return null;
        const iso = datePart.replace(/:/g, "-") + "T" + timePart;
        const date = new Date(iso);
        return isNaN(date.getTime()) ? null : date;
      }
    }
  } catch { /* bounds error */ }
  return null;
}

/**
 * Validate that the image's EXIF timestamp falls within the session window.
 * Returns { valid, exifDate, message } 
 */
export async function validateScreenshotTimestamp(
  file: File,
  sessionCreatedAt: string,
  sessionEndTime: string,
  bufferMinutes: number = 30
): Promise<{
  valid: boolean;
  exifDate: Date | null;
  stripped: boolean;
  message: string;
}> {
  const exifDate = await extractExifDate(file);

  if (!exifDate) {
    return {
      valid: false,
      exifDate: null,
      stripped: true,
      message: "No timestamp found in image metadata. EXIF data may have been stripped — this could indicate tampering.",
    };
  }

  const sessionStart = new Date(sessionCreatedAt);
  const sessionEnd = new Date(sessionEndTime);

  // Add buffer to account for timezone differences and slight delays
  const bufferMs = bufferMinutes * 60 * 1000;
  const windowStart = new Date(sessionStart.getTime() - bufferMs);
  const windowEnd = new Date(sessionEnd.getTime() + bufferMs);

  if (exifDate < windowStart || exifDate > windowEnd) {
    const formatted = exifDate.toLocaleString();
    return {
      valid: false,
      exifDate,
      stripped: false,
      message: `Screenshot timestamp (${formatted}) falls OUTSIDE the session window. Expected between ${sessionStart.toLocaleString()} and ${sessionEnd.toLocaleString()}.`,
    };
  }

  return {
    valid: true,
    exifDate,
    stripped: false,
    message: `Timestamp verified: ${exifDate.toLocaleString()}`,
  };
}
