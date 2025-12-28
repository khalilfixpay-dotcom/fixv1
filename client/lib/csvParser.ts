export interface Lead {
  id: number;
  name: string;
  industry: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  emailUnlocked: boolean;
  phoneUnlocked: boolean;
  isImported?: boolean;
}

/**
 * Parse CSV content into Lead objects
 * Expected format: Name,Industry,Location,Email,Phone,Website
 */
export function parseCSV(csvContent: string): Lead[] {
  const lines = csvContent.trim().split("\n");

  if (lines.length < 2) {
    console.warn("CSV file must contain headers and at least one row");
    return [];
  }

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  const expectedHeaders = [
    "Name",
    "Industry",
    "Location",
    "Email",
    "Phone",
    "Website",
  ];

  const headerMatch = headers.every((h) => expectedHeaders.includes(h));
  if (!headerMatch) {
    console.warn(
      "CSV headers don't match the expected format. Expected: " +
        expectedHeaders.join(", "),
    );
    return [];
  }

  const leads: Lead[] = [];
  let id = 1;

  const validLines = lines.slice(1).filter((line) => line.trim());

  for (const line of validLines) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    // Parse CSV line with quote handling
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.replace(/^"|"$/g, "").trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.replace(/^"|"$/g, "").trim());

    if (values.length >= 6) {
      const [name, industry, location, email, phone, website] =
        values.slice(0, 6);

      if (name) {
        leads.push({
          id,
          name,
          industry,
          location,
          email,
          phone,
          website,
          emailUnlocked: email === "Locked" ? false : false,
          phoneUnlocked: phone === "Locked" ? false : false,
        });
        id++;
      }
    }
  }

  return leads;
}

/**
 * Load leads from a CSV file URL
 */
export async function loadLeadsFromCSV(csvUrl: string): Promise<Lead[]> {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      console.error("Failed to fetch CSV file:", response.statusText);
      return [];
    }

    const csvContent = await response.text();
    return parseCSV(csvContent);
  } catch (error) {
    console.error("Error loading CSV file:", error);
    return [];
  }
}
