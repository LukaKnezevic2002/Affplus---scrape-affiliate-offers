//import modules
const cheerio = require('cheerio')
const request = require('request')
var sql = require('mysql');

var con = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "offers"
  });


  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");    
});

//scrape
async function scrapeWebsite(url){
    return new Promise((resolve, reject) => {
        request(url, async function(error,response,html){
            if(!error && response.statusCode == 200){
                var $ = cheerio.load(html)
        
                try{
                    let status = 'ok'
        
                    let labels = $('.table tbody tr th');

                    let logo = ""
                    if($(".flex.w-full.mb-3 .ml-4 img") != null){
                      logo = $(".flex.w-full.mb-3 .ml-4 img").attr("src")
                    }

                    let cover = ""
                    if($(".bg-cover") != null){
                        const styleAttr = $(".bg-cover").attr("style");
                        const backgroundImageUrl = /url\((.+)\)/.exec(styleAttr)[1].replace(/['"]+/g, "");
                        cover = backgroundImageUrl
                    }

                    let name = ""
                    if($(".font-extrabold.text-base.mr-3") != null) {
                      name = $(".font-extrabold.text-base.mr-3").text().trim()
                    }

                    let trackingsoftware = ""
                    if($(".hidden.text-xs.leading-none span").first() != null){
                        trackingsoftware = $(".hidden.text-xs.leading-none span").first().text().trim();
                    }

                    let paymentFreqency = ""
                    if($(".hidden.text-xs.leading-none span").eq(2) != null){
                        paymentFreqency = $(".hidden.text-xs.leading-none span").eq(2).text().trim();
                    }

                    let reviewsLink = ""
                    if($(".hidden.text-xs.leading-none a").first() != null){
                        reviewsLink = $(".hidden.text-xs.leading-none a").first().text().trim().replace(/[^0-9]/g, "");
                    }

                    let offersLink = ""
                    if($(".hidden.text-xs.leading-none a").eq(1) != null){
                       offersLink = $(".hidden.text-xs.leading-none a").eq(1).text().trim().replace(/[^0-9]/g, "");
                    }
        
                    var returnValues = {
        
                        status,
                        logo,
                        cover,
                        name,
                        trackingsoftware,
                        paymentFreqency,
                        reviewsLink,
                        offersLink

                    }
                    resolve(returnValues);
                }
        
               
                catch{
                    var status = 'offline'
                    var logo = ""
                    var cover = ""
                    var name = ""
                    var trackingsoftware = ""
                    var paymentFreqency = ""
                    var reviewsLink = ""
                    var offersLink = ""
        
                    var returnErrValues = [
                        
                        status, 
                        logo,
                        cover,
                        name,
                        trackingsoftware,
                        paymentFreqency,
                        reviewsLink,
                        offersLink
                    ]
                   reject(returnErrValues)
                }
                
            }
        })
    })
}
 
/*
scrapeWebsite('https://www.affplus.com/n/gurumedia')
.then((returnValues) => {
    console.log(returnValues);
})
.catch((returnErrValues) => {
    console.error(returnErrValues);
});
*/

async function repeatScrape() {
    var count = 0;
    con.query("SELECT id,url FROM affplus WHERE status != 'ok' and status != 'offline' LIMIT 10;", async function (err, rows) {
        if (err) throw err;
        else {
  
            if (rows.length) {
                for (var i = 0; i < rows.length; i++) {
                    count++;
  
                    var pagedbID = rows[i].id;
                    var url = rows[i].url;
                    console.log(url);
  
                    var scrapeReturn = await scrapeWebsite(url);
  
                    console.log(scrapeWebsite);
  
                    var statusEsc = con.escape(scrapeReturn.status);
                    var logoEsc = con.escape(scrapeReturn.logo);
                    var coverEsc = con.escape(scrapeReturn.cover);
                    var nameEsc = con.escape(scrapeReturn.name);
                    var trackingsoftwareEsc = con.escape(scrapeReturn.trackingsoftware);
                    var paymentFreqencyEsc = con.escape(scrapeReturn.paymentFreqency);
                    var reviewsEsc = con.escape(scrapeReturn.reviews);
                    var offersEsc = con.escape(scrapeReturn.offers);
                    
                    var sql = "UPDATE affplus SET status = " + statusEsc + ", logo = " + logoEsc + ", cover = " + coverEsc + ", name = " + nameEsc + ", trackingsoftware = " + trackingsoftwareEsc + ", paymentFreqency = " + paymentFreqencyEsc + ", reviewsLink = " + reviewsEsc + ", offersLink = " + offersEsc + " WHERE id = '" + pagedbID + "'";
  
                    con.query(sql, function (err, result) {
                      if (err) throw err;
                      console.log(result.affectedRows + " record(s) updated");
                    });
                    
                    if(rows.length == count) {
                        repeatScrape();
                        return;
                    }
                }
            }
        }
    })
  
  }
  
  repeatScrape()