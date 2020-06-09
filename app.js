//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongeeose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongeeose.connect("mongodb+srv://admin-luis:Test123@cluster0-0aj8t.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
    name: String,
};

const Item = mongeeose.model("Item", itemsSchema);

const task1 = new Item({
    name: "Welcome to your todolist!"
});

const task2 = new Item({
    name: "Hit the + button too add a new item."
});

const task3 = new Item({
    name: "<-- Hit this to delete and item."
});

const defaultItems = [task1, task2, task3];

const listSchema = {
    listUrl: String,
    items: [itemsSchema]
};

const List = mongeeose.model("List", listSchema)



app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfuly saved items to DB");
                }
            });
            res.redirect("/");
        }else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
       name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else {
        List.findOne({listUrl: listName}, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName)
        });
    }


});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err){
                res.redirect("/");
            }
        });
    }else {
        List.findOneAndUpdate({listUrl: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList) {
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }


});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({listUrl: customListName}, function (err, foundList) {
        if (!err){
            if(!foundList){
                //Create a new list
                const list = new List({
                    listUrl: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }else {
                //Show an existing list
                res.render("list", {listTitle: foundList.listUrl, newListItems: foundList.items})
            }
        }
    });



});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
});
