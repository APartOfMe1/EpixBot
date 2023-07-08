module.exports = {
    genId(length) {
        const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
        var final = "";
    
        // Create a string with the specified length
        for (let i = 0; i < length; i++) {
            final += characters[Math.floor(Math.random() * characters.length)];
        };
    
        return final;
    }
}