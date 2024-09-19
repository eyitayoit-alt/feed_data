function hexToUtf8(hex) {
    // Helper function to convert a hexadecimal string to a UTF-8 string
    var bytes = [];
    for (var i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    var utf8String = new TextDecoder().decode(new Uint8Array(bytes));
    return utf8String;
}

export function decodeFeedName(feed_name) {
    // Step 1: Extract substring (skip the first two characters)
    var hexString = feed_name.substring(2);

    // Step 2 &amp; 3: Convert the hex string to bytes and decode to a string
    var decodedString = hexToUtf8(hexString);

    // Step 4: Remove trailing null characters
    var stringWithoutNulls = decodedString.replace(/\x00+$/g, '');

    // Step 5: Strip leading and trailing whitespace
    var finalString = stringWithoutNulls.trim();

    return finalString;
}