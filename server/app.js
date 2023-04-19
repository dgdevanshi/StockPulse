const express = require("express");
const mongoose = require("mongoose");
const {spawn} = require("child_process");

const Company = require("./models/company");

const PORT = process.env.PORT || 3696;
const app = express();
const DB = "mongodb+srv://dg325:7cKarDuMHNHxnhbn@companies.yp9t9ui.mongodb.net/?retryWrites=true&w=majority"

app.use(express.json());
app.set("view engine", "ejs");
app.set("views", "views");

app.get("/", (req, res) => {
    res.render("home");
});


app.get("/company", async (req, res) => {
    let data1;
    let newHeadlines = ""
    let input = req.query.company;
    input = input.toLowerCase();
    const py = spawn("python", ["crawler.py"]);
    py.stdin.write(input);
    py.stdin.end(); 
    py.stdout.on("data", async (data) => {
        data1 = data.toString()
        const myObj = JSON.parse(data1)
        let newLinks = []
        for (let key in myObj) {
            newLinks.push({newsName: key, newsLink: myObj[key]})
        }
        let data2;
        for (let key in myObj) {
            for (let i in myObj[key]) {
                let l = myObj[key][i].toString();
                py2 = spawn("python", ["scraper.py", l]);
                function processHeadlines() {
                    return new Promise((resolve, reject) => {
                        py2.stdout.on("data", async (data) => {
                            data2 = data.toString()
                            newHeadlines += data2
                            resolve(); 
                        });
                    });
                }
                await processHeadlines();              
                py2.on("close", (req, res) => {})
            }
        }
        const company = await Company.findOne({name: input});
        if (company) {
            for (let key in myObj) {
                for (let i in company.links) {
                    const newsName = company.links[i].newsName;
                    if (newsName === key) {
                        company.links[i].newsLink.push(...myObj[key]);
                        company.headlines += newHeadlines;
                        break
                    }
                }
                await company.save() 
            }
        } else {
            let newCompany = new Company({name: input, links: newLinks, headlines: newHeadlines});
            newCompany.save(); 
        }
    });
    py.on("close", (code) => { 
        console.log("Crawled, Scraped and Saved") 
    }); 

    const py3 = spawn("python", ["predict.py"]);
    test = newHeadlines.toString()
    py3.stdin.write(test)
    py3.stdin.end();
    function predictSentiment() {
        return new Promise((resolve, reject) => {
            py3.stdout.on("data", async (data) => {
                let data3 = data.toString();
                res.send("Sentiment: " + data3);
                resolve();
            });
        });
    }
    await predictSentiment();
    py3.on("close", (code) => {
        console.log("Predicted")
    });
});


mongoose.set("strictQuery", false);
mongoose
    .connect(DB)
    .then(() => {
    console.log("Connection Successful");
    })
    .catch((e) => {
    console.log(e);
    });

app.listen(PORT, "0.0.0.0", () => {
    console.log(`connected at port ${PORT}`);
});