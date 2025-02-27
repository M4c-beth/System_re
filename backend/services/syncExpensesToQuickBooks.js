const { makeApiCall } = require("./quickbooksService");
const Expense = require("../models/Expense");

const syncExpensesToQuickBooks = async () => {
    try {
        const expenses = await Expense.find({ status: "Approved" });
        
        for (const expense of expenses) {
            const requestBody = {
                Amount: expense.amount,
                Currency: "USD",
                PrivateNote: expense.description,
                PaymentType: "Cash",
                CustomerRef: { value: "1" } // Change to actual customer ID
            };

            await makeApiCall("payment", "POST", requestBody);
            console.log(`✅ Expense ${expense._id} synced to QuickBooks.`);
        }
    } catch (error) {
        console.error("Error syncing expenses:", error);
    }
};

module.exports = { syncExpensesToQuickBooks };
