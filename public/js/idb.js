//db connections
let db;

const request = indexedDB.open("budget-tracker", 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore("pending", {autoIncrement: true});
};

// store reference database
request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        // pushTransaction()
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode)
};

// submit new transactions while not having any connections
function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");
    const storeTransaction = transaction.objectStore("pending");
    storeTransaction.add(record);
};

function pushTransaction() {
    const transaction = db.transaction(["pending"], "readwrite");
    const storeTransaction = transaction.objectStore("pending");
    const getAll = storeTransaction.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                  }
            })
            .then(response => response.json())
            .then(serverResponse => {

                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // one or more transactions
                const transaction = db.transaction(["pending"], "readwrite");
                const storeTransaction = transaction.objectStore("pending");
                storeTransaction.clear();
                // ^^ clear all items in store
            })

            .catch(err => console.log(err));
        }
    }
};

window.addEventListener("online", pushTransaction);
//listen for the app to come online