export function formatFileName(fileName:string) {
    // Replace forward slashes with underscores first
    let formatted = fileName.replace(/\//g, '_');
    
    // Remove special characters (except underscores) and spaces
    formatted = formatted.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Convert to lowercase
    formatted = formatted.toLowerCase();
    
    // Remove multiple consecutive dashes
    formatted = formatted.replace(/-+/g, '-');
    
    // Remove multiple consecutive underscores
    formatted = formatted.replace(/_+/g, '_');
    
    // Remove leading and trailing dashes and underscores
    formatted = formatted.replace(/^[-_]+|[-_]+$/g, '');
    
    // Ensure there's only one dot before the extension
    formatted = formatted.replace(/\.+/g, '.');
    
    return formatted;
  }