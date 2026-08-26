/**
 * Safe clipboard copy with fallback for iframe sandboxes and unfocused documents.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern navigator.clipboard first
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // In sandboxed iframes or unfocused documents, writeText can throw:
      // 'Document is not focused' or 'NotAllowedError'
      console.warn('navigator.clipboard.writeText failed, using fallback copy:', err);
    }
  }

  // Fallback: standard input element selection & execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Avoid scrolling to bottom of page
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('execCommand copy failed:', err);
    return false;
  }
}
