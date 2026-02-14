export interface ParsedCollegeDetails {
    campus: string;
    department: string;
    branch: string;
    section: string;
    year: string;
    name: string;
}

export function parseCollegeDetails(rawString: string): ParsedCollegeDetails | null {
    if (!rawString) return null;

    // Expected Format: [CAMPUS] [DEPT] [BRANCH] [SECTION] [YEAR] [NAME...]
    // Example: "EC S&H CSE 1D 2025 DHRUV SRIVASTAVA"
    // Example: "RR S&H AIML 2B 2026 JOHN DOE"

    const parts = rawString.trim().split(/\s+/);

    if (parts.length < 6) {
        // Fallback if string is too short or malformed
        return {
            campus: 'Unknown',
            department: '',
            branch: '',
            section: '',
            year: '',
            name: rawString // Just return the whole string as name
        };
    }

    // 1. Campus (First word)
    // 'EC' -> 'ECC', 'RR' -> 'RR'
    let campus = parts[0].toUpperCase();
    if (campus === 'EC') campus = 'ECC';

    // 2. Department (Second word) - usually S&H, ENG, etc.
    const department = parts[1];

    // 3. Branch (Third word)
    // Check against common branches if needed, or just take the 3rd word
    const branch = parts[2];

    // 4. Section (Fourth word)
    const section = parts[3];

    // 5. Year (Fifth word) - typically 4 digits
    const year = parts[4];

    // 6. Name (Everything after the year)
    // Find the index of the year in the original parts array, then join everything after it
    const yearIndex = 4;
    const nameParts = parts.slice(yearIndex + 1);
    const rawName = nameParts.join(' ');

    // Convert name to Title Case (e.g., "DHRUV SRIVASTAVA" -> "Dhruv Srivastava")
    const name = rawName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
        campus,
        department,
        branch,
        section,
        year,
        name
    };
}
