export const generateReply = async (text) => {

    const message = text.toLowerCase();


    if(message.includes("hello") || message.includes("hi")){
        return "Hello How can I help you today?";
    }


    if(message.includes("price")){
        return "Please tell me the product name and I will provide the price.";
    }


    if(message.includes("catalog")){
        return "Here is our product catalog.";
    }


    return "Sorry, I didn't understand your message.";
}