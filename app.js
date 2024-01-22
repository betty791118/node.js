//準備資料庫連線
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://XXXXXX";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
let db = null;//設定全域變數
async function run() {
  
    await client.connect();
    db = await client.db("website-1");
    console.log("Database Ready")
}
run().catch(console.dir);

//準備後端伺服器

const express=require("express");//載入express
const app=express();//建立application 物件
const bodyParser=require("body-parser");//設定支援取得POST方法的參數
app.use(bodyParser.urlencoded({extend:true}));
//express session 做使用者狀態管理
const session = require('express-session')
app.use(session({
    secret: "iambetty",
    resave: false,
    saveUninitialized: true
  }))

//使用樣板引擎 ejs pug
app.set("view engine", "ejs")//指定views 的資料夾
//處理網站的靜態檔案網址對應
app.use(express.static("public"));

//使用POST方法,app.post 處理來自路徑/verify?password=密碼的連線
//res.send ("false")可以回傳東西
//res.redirect ("/")到其他葉面
app.post("/verify", function(req,res){
    //取得POST 方法傳遞進來的參數 req.body 參數名稱
    let passwd="abcd";
    let result=req.body.password;
    if (passwd===result){
        req.session.isLogin=true;
        res.redirect ("/member");
    }else{
        req.session.isLogin=false;
        res.redirect ("/")
    }
})



app.post("/signup", async function(req,res){
    //取得POST 方法傳遞進來的參數 req.body 參數名稱
    let name=req.body.name;
    let password=req.body.password;
    let email=req.body.email;
    //新增到資料庫
    let collection=db.collection("member");
    //在資料庫中尋找是否有重複的email 會員資料
    let result = await collection.findOne({
        email:email
    })
    if (result !== null ){
        res.send("Failed: Repeated Email")
    }else{
        await collection.insertOne({
            name:name,
            email:email,
            password:password,
            time:Date.now()
        });
        res.send("ok")
    }
   
})

app.post("/signin", async function(req,res){
    //取得POST 方法傳遞進來的參數 req.body 參數名稱
    let email=req.body.email;
    let password=req.body.password;
    let collection=db.collection("member");
    let member = await collection.findOne({
        $and:[
            {email:email},
            {password:password}
        ]
    });
    if (member !== null){
        req.session.member={
            name:member.name, email:member.email
        }
        res.redirect ("/member");
    }else{
        req.session.member=null;
        res.redirect ("/")
    }
})

app.get("/member", async function(req, res){
    if (req.session.member){
        let collection=db.collection("message")

        let blog = await collection.find({
            name:req.session.member.name
        }).sort({
            time:-1 
        })

        let blogs = await blog.toArray();
        console.log("blogs", blogs);

        res.render(
            "member.ejs", 
            {
                name:req.session.member.name,
                email:req.session.member.email,
                blogs:blogs
            }
        );
    }else{
        res.redirect("/");
    }
    
})

app.get("/signout", function(req, res){
    req.session.member=null;
    res.redirect("/")
})

app.post("/postMessage", async function(req, res){
    let content=req.body.content;
    let name=req.session.member.name;
    let time=Date.now();
    //放進資料庫
    let collection=db.collection("message")
    await collection.insertOne({
        name:name, content:content, time:time
    });
    res.redirect("/member")
})



//使用樣板引擎方法, 處理來自路徑/square?num=數字 的連線
app.get("/square", function(req, res){
    //取得網址列的參數req.query.參數名稱
    let num=req.query.aa;
    let result=num*num;
    res.render("result.ejs", {ans:result});
});




//啟動伺服器在http://127.0.0.1:3000/路徑 ==>本基端的伺服器127.0.0.1
//http://127.0.0.1:3000/路徑?參數名稱=資料&參數名稱=&
app.listen(3000, function(){
    console.log("server started: http://127.0.0.1:3000/ ");
});
