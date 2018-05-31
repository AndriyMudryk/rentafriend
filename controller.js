const express = require('express');
const bodyParser = require('body-parser');
const {Wit, log} = require('node-wit');
const request = require('request');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*let CONNECTIONSTRING = {
  host: "localhost",
  user: "root",
  password: "12345",
  database: "mydbright"
  //multipleStatements: true
};*/
let CONNECTIONSTRING = {
  host: "rentafriend.mysql.database.azure.com",
  user: "user@rentafriend",
  password: "Aa123456",
  database: "mydbright"
  //multipleStatements: true
};

let FB_VERIFY_TOKEN = "blabla";

var http = require('http');
var mysql = require('mysql');
//var sqlquery = "SELECT * FROM users_clients WHERE login = 'client1' AND password = 'kuku1'";
var userInfo = [];
var friendInfo = [];
var user = "";

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
}).on('error', function(err){
    console.log('on error handler');
    console.log(err);
});

process.on('uncaughtException', function(err) {
    console.log('process.on handler');
    console.log(err);
});


function getIdUser(ip) {
   for (i = 0; i < userInfo.length; i++) {
   	  if(userInfo[i].ip == ip){
         return i;
   	  }
   }
}

function getIdFriend(ip) {
   for (i = 0; i < friendInfo.length; i++) {
   	  if(friendInfo[i].ip == ip){
         return i;
   	  }
   }
}

//post-methods

app.post('/login', (req, res) => {
  console.log(JSON.stringify(req.body));
  var con = mysql.createConnection(CONNECTIONSTRING);
  con.connect(function(err) {
  if (err) throw err;
  console.log(req.body.first);
  con.query("SELECT * FROM users_clients WHERE login = '" + req.body.first + "' AND password = '" + req.body.second + "';", function (err, result, fields) {
      if (err) throw err;
      if(result[0]) { 
      	temp = {"id":result[0].id,"login":result[0].login, "password":result[0].password,"client_id":result[0].client_id, "ip":req.body.ip};
      	userInfo.push(temp);
      	user = "client";
      	res.sendFile(("getinfoclient.html"), {
      		root: __dirname
      	});
      	//res.redirect('/getinfoclient');
      }
      else {
        con.query("SELECT * FROM users_friends WHERE login = '" + req.body.first + "' AND password = '" + req.body.second + "';", function (err, result, fields) {
        if (err) throw err;
        if(result[0]) { 
          temp = {"id":result[0].id,"login":result[0].login, "password":result[0].password,"friend_id":result[0].friend_id, "ip":req.body.ip};
      	  friendInfo.push(temp);
      	  user = "friend";
      	  res.sendFile(("getinfofriend.html"), {
      		  root: __dirname
      	});
        }
        else {
           res.send("Invalid login or password <a href='rentfriend.html'>Ale ty nubasyava</a>");
        }
      });
     }
    });
  });
  //res.send("Invalid login or password");
});

app.post('/getinfoclient', (req,res) => {
   console.log(JSON.stringify(req.body));
   var con = mysql.createConnection(CONNECTIONSTRING);
   if (userInfo.length == 0) {
   	  res.send("Log in again, please! <a href='login.html'> </a>");
   }
   let table = "<head><link rel='stylesheet' href='opastyle.css'/></head><table class='tbl'>";
   con.connect(function(err) {
   if(req.body.id == "10") {
   	con.query("select count(fb.id) as feedback_count, group_concat(f.name) from groups_clients as gc join feedback as fb on fb.groups_clients_id = gc.id " +
             " join groups_friends as gf on fb.groups_friends_id = gf.id join friend as f on f.id = gf.id group by gc.id having count(gc.client_id) > 1 order by feedback_count DESC;", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr><td>" + result[i].id + "</td>" + "<td>" + result[i].name + "</td>" + "<td>" + result[i].surname + "</td>" + "<td>" + result[i].number + "</td></tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "1") {
   	 table += "<tr><th> Name </th> <th> Surname </th><tr>";
   	 console.log(userInfo);
   	 con.query("select distinct f.name, f.surname from _order as o join groups_friends as gf on o.groupf_id = gf.group_id " +  
               "join friend as f on f.id = gf.friend_id join client as c on c.id = o.client_id where o.client_id = " + userInfo[getIdUser(req.body.ip)].client_id + " AND (SELECT count(o1.groupf_id) " +
                "FROM _order as o1 group by o1.client_id, o1.groupf_id having o1.client_id = o.client_id and o1.groupf_id = o.groupf_id) >= " + req.body.first +
                " AND o.date between '"+ req.body.second +"' AND '"+ req.body.third + "';", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].name + "</td>" + "<td>" + result[i].surname + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "2") {
   	 table += "<tr><th> Name </th> <th> Surname </th><tr>";
   	 console.log(userInfo);
   	 con.query("select f.name,f.surname, gf.group_id from _order as o join groups_friends as gf on o.groupf_id = gf.group_id join friend as f" +
               " on gf.friend_id = f.id where o.date between '" + req.body.second + "' AND '" + req.body.third + "'  group by f.name,f.surname, gf.group_id" + 
               " having count(o.groupf_id) <= " + req.body.first + ";", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].name + "</td>" + "<td>" + result[i].surname + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "3") {
   	 table += "<tr><th> Month </th> <th> Dates </th></tr>";
   	 console.log(userInfo);
   	 con.query("SELECT DATE_FORMAT(date, '%m') as 'month',COUNT(id) as 'total' FROM _order GROUP BY DATE_FORMAT(date, '%Y%m');", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].month + "</td>" + "<td>" + result[i].total + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "6") {
   	 table += "<tr><th> Holiday </th></tr>";
   	 console.log(userInfo);
   	 con.query("select h.name from holiday as h join _order as o on h.id = o.holiday_id join client as c on o.client_id = c.id join groups_friends as gf" + 
               " on o.groupf_id = gf.id join friend as f on gf.friend_id = f.id where o.date between '" + req.body.second + "' AND '" + req.body.third + "'" + 
               " and c.id = '" + userInfo[getIdUser(req.body.ip)].client_id + "' and f.surname = '" + req.body.first + "';", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].name + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "4") {
   	 table += "<tr><th> Present </th></tr>";
   	 console.log(userInfo);
   	 con.query("select p.name from client_has_friend as chf join present as p on chf.present_id=p.id join friend as f on chf.friend_id=f.id join vacation as v on f.id=v.friend_id" + 
   	 	       " where chf.date between '" + req.body.second + "' AND '" + req.body.third + "' and chf.client_id= '" + userInfo[getIdUser(req.body.ip)].client_id + "' order by v.days_amount desc;", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].name + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "7") {
   	 table += "<tr><th> Date </th> <th> Count </th></tr>";
   	 console.log(userInfo);
   	 con.query("DROP TEMPORARY TABLE IF EXISTS test;", function (err, result, fields) {
      	if (err) throw err;
      	con.query("CREATE TEMPORARY TABLE test (`id` int NOT NULL AUTO_INCREMENT, `date` date NOT NULL, PRIMARY KEY (`id`));", function (err, result, fields) {
      	   if (err) throw err;
      	   con.query("set @max_date = (select max(v.vacation_end) as min_date from vacation as v); ", function (err, result, fields) {
      	      if (err) throw err;
      	      con.query("set @min_date = ( select min(v.vacation_begin) as min_date from vacation as v);", function (err, result, fields) {
      	        if (err) throw err;
      	         con.query("call date_between(@min_date, @max_date);", function (err, result, fields) {
      	            if (err) throw err;
      	            con.query("select t.date,count(t.id) as count from test as t join vacation as v on t.date>= v.vacation_begin or t.date <= v.vacation_end where t.date between v.vacation_begin and v.vacation_end " + 
                              " group by t.id having count between " + req.body.first + " and " + req.body.second + ";", function (err, result, fields) {
      	              if (err) throw err;
      	              if(result.length != 0) { 
      		              for (i = 0; i < result.length; i++)
      	                  {
                               table += "<tr>" + "<td>" + result[i].date.toDateString() + "</td>" + "<td>" + result[i].count + "</td>" + "</tr>";
      	                  }
      		              console.log(result);
      	              }
      	              table += "</table>";
      	              res.send(table);
  	                });
  	              });
  	           });
  	        });
  	    });
  	});
   } else if (req.body.id == "5") {
   	 table += "<tr><th> Count </th> <th> Friend </th></tr>";
   	 console.log(userInfo);
   	 con.query("select count(fb.id) as fcount, group_concat(f.name, ' ', f.surname SEPARATOR ', ') as people from groups_clients as gc join feedback as fb " + 
               " on fb.groups_clients_id = gc.id join friend as f on fb.friend_id = f.id where fb.date between '" + req.body.second + "' AND '" + req.body.third + "' group by gc.id " +
               "having count(gc.client_id) >= " + req.body.first  + " order by fcount DESC;", function (err, result, fields){
             if (err) throw err;
             if(result.length != 0) { 
      		   for (i = 0; i < result.length; i++)
      	       {
                   table += "<tr>" + "<td>" + result[i].fcount + "</td>" + "<td>" + result[i].people + "</td>" + "</tr>";
      	       }
      		   console.log(result);
      	     }
             table += "</table>";
      	     res.send(table);
     });
   }
  });
});

app.post('/getinfofriend', (req,res) => {
   console.log(JSON.stringify(req.body));
   var con = mysql.createConnection(CONNECTIONSTRING);
   if (friendInfo.length == 0) {
   	  res.send("Log in again, please! <a href='login.html'> </a>");
   }
   let table = "<head><link rel='stylesheet' href='opastyle.css'/></head><table class='tbl'>";
   con.connect(function(err) {
   if(req.body.id == "10") {
   	con.query("SELECT * FROM friend WHERE name = '" + req.body.first + "';", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr><td>" + result[i].id + "</td>" + "<td>" + result[i].name + "</td>" + "<td>" + result[i].surname + "</td>" + "<td>" + result[i].number + "</td></tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "2") {
   	 table += "<tr><th> Holiday </th></tr>";
   	 console.log(userInfo);
   	 con.query("select h.name from _order as o join holiday as h on o.holiday_id = h.id join groups_friends as gf on o.groupf_id = gf.group_id join friend as f" +
                " on gf.friend_id = f.id group by h.name, f.id, o.date having f.id = '"+ friendInfo[getIdFriend(req.body.ip)].friend_id + "' and count(o.groupf_id) >=" + req.body.first + " AND o.date between '"+ req.body.second + "' AND '"+ req.body.third + "';", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].name + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	res.send(table);
      	table += "</table>";
  	});
   } else if (req.body.id == "4") {
   	 table += "<tr><th> Month </th> <th> Count </th></tr>";
   	 console.log(userInfo);
   	 con.query("SELECT DATE_FORMAT(date, '%m') as 'month',COUNT(id) as 'total' FROM _order GROUP BY DATE_FORMAT(date, '%Y%m');", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].month + "</td>" + "<td>" + result[i].total + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "7") {
   	 table += "<tr><th> Holiday </th></tr>";
   	 console.log(userInfo);
   	 con.query("select h.name from holiday as h join _order as o on h.id = o.holiday_id join client as c on o.client_id = c.id join groups_friends as gf" + 
               " on o.groupf_id = gf.id join friend as f on gf.friend_id = f.id where o.date between '" + req.body.second + "' AND '" + req.body.third + "'" + 
               " and c.surname = '" + req.body.first + "' and f.id = '" + friendInfo[getIdFriend(req.body.ip)].friend_id + "';", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].name + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	table += "</table>";
      	res.send(table);
  	});
   } else if (req.body.id == "1") {
   	 table += "<tr><th> Id </th> <th> Name </th></tr>";
   	 console.log(userInfo);
   	 con.query("select c.id, c.name from _order as o join client as c on o.client_id = c.id join groups_friends as gf on o.groupf_id = gf.group_id join friend as f" +
               " on gf.friend_id = f.id " + " where o.date between '" + req.body.second + "' AND '" + req.body.third + "'" +
               " group by c.id, c.name, gf.friend_id having gf.friend_id = '" + friendInfo[getIdFriend(req.body.ip)].friend_id + "' and count(o.groupf_id) = " + req.body.first +";", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].id + "</td>" + "<td>" + result[i].name + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	res.send(table);
      	table += "</table>";
  	});
   } else if (req.body.id == "3") {
   	 table += "<tr><th> Name </th> <th> Surname </th></tr>";
   	 console.log(userInfo);
   	 con.query("select distinct c.name,c.surname from _order as o join client as c on o.client_id = c.id join groups_friends as gf on o.groupf_id = gf.group_id" +
               " join friend as f on gf.friend_id = f.id group by o.client_id, o.groupf_id, o.date having count(distinct f.name,f.surname) >= " + req.body.first + 
               " AND o.date between '" + req.body.second + "' AND '" + req.body.third + "';", function (err, result, fields) {
      	if (err) throw err;
      	if(result.length != 0) { 
      		for (i = 0; i < result.length; i++)
      	    {
                table += "<tr>" + "<td>" + result[i].name + "</td>" + "<td>" + result[i].surname + "</td>" + "</tr>";
      	    }
      		console.log(result);
      	}
      	res.send(table);
      	table += "</table>";
  	});
   } else if (req.body.id == "8") {
   	 table += "<tr><th> Date </th> <th> Count </th></tr>";
   	 console.log(userInfo);
   	 con.query("DROP TEMPORARY TABLE IF EXISTS test;", function (err, result, fields) {
      	if (err) throw err;
      	con.query("CREATE TEMPORARY TABLE test (`id` int NOT NULL AUTO_INCREMENT, `date` date NOT NULL, PRIMARY KEY (`id`));", function (err, result, fields) {
      	   if (err) throw err;
      	   con.query("set @max_date = (select max(v.vacation_end) as min_date from vacation as v); ", function (err, result, fields) {
      	      if (err) throw err;
      	      con.query("set @min_date = ( select min(v.vacation_begin) as min_date from vacation as v);", function (err, result, fields) {
      	        if (err) throw err;
      	         con.query("call date_between(@min_date, @max_date);", function (err, result, fields) {
      	            if (err) throw err;
      	            con.query("select t.date,count(t.id) as count from test as t join vacation as v on t.date>= v.vacation_begin or t.date <= v.vacation_end where t.date between v.vacation_begin and v.vacation_end " + 
                              " group by t.id having count between " + req.body.first + " and " + req.body.second + ";", function (err, result, fields) {
      	              if (err) throw err;
      	              if(result.length != 0) { 
      		              for (i = 0; i < result.length; i++)
      	                  {
                               table += "<tr>" + "<td>" + result[i].date.toDateString() + "</td>" + "<td>" + result[i].count + "</td>" + "</tr>";
      	                  }
      		              console.log(result);
      	              }
      	              table += "</table>";
      	              res.send(table);
  	                });
  	              });
  	           });
  	        });
  	    });
  	});
   } else if (req.body.id == "5") {
   	 table += "<tr><th> Name </th> <th> Surname </th><th> Holiday </th> <th> Count </th></tr>";
   	 console.log(userInfo);
   	 con.query("select f.name, f.surname, h.name as hname, count(o.groupf_id) AS Count from _order as o join groups_friends as gf on o.groupf_id = gf.group_id join friend as f " + 
               " on gf.friend_id = f.id join holiday as h on o.holiday_id =h.id where o.date between '" + req.body.second + "' AND '" + req.body.third + "' and (SELECT count(gf1.friend_id) from groups_friends as gf1 join _order as o" + 
               " group by gf1.group_id having gf1.group_id = o.groupf_id) > " + req.body.first + " group by f.id, f.name, f.surname, o.holiday_id having f.id = " + friendInfo[getIdFriend(req.body.ip)].friend_id + ";",  function (err, result, fields){
             if (err) throw err;
             if(result.length != 0) { 
      		   for (i = 0; i < result.length; i++)
      	       {
                   table += "<tr>" + "<td>" + result[i].name + "</td>" + "<td>" + result[i].surname + "</td>" + "<td>" + result[i].hname + "</td>" + "<td>" + result[i].Count + "</td>" + "</tr>";
      	       }
      		   console.log(result);
      	     }
             table += "</table>";
      	     res.send(table);
     });
   } else if (req.body.id == "9") {
   	 table += "<tr><th> Average </th> <th> Month </th></tr>";
   	 console.log(userInfo);
   	 con.query("select avg(clients_count) as avg, max(selected_month) as selected_month from (select count(gc.client_id) as clients_count, month(fb.date) as selected_month from groups_clients as gc " + 
               " join feedback as fb on gc.groupc_id = fb.groups_clients_id join friend as f on fb.friend_id = f.id where f.id = " + friendInfo[getIdFriend(req.body.ip)].friend_id + " group by gc.groupc_id, month(fb.date)) MyTable group by selected_month",  function (err, result, fields){
             if (err) throw err;
             if(result.length != 0) { 
      		   for (i = 0; i < result.length; i++)
      	       {
                   table += "<tr>" + "<td>" + result[i].avg + "</td>" + "<td>" + result[i].selected_month +  "</td>" + "</tr>";
      	       }
      		   console.log(result);
      	     }
             table += "</table>";
      	     res.send(table);
     });
   } else if (req.body.id == "6") {
   	 table += "<tr><th> Count </th> <th> Friend </th></tr>";
   	 console.log(userInfo);
   	 con.query("select count(fb.id) as fcount, group_concat(f.name, ' ', f.surname SEPARATOR ', ') as people from groups_clients as gc join feedback as fb " + 
               " on fb.groups_clients_id = gc.id join friend as f on fb.friend_id = f.id where fb.date between '" + req.body.second + "' AND '" + req.body.third + "' group by gc.id " +
               "having count(gc.client_id) >= " + req.body.first  + " order by fcount DESC;", function (err, result, fields){
             if (err) throw err;
             if(result.length != 0) { 
      		   for (i = 0; i < result.length; i++)
      	       {
                   table += "<tr>" + "<td>" + result[i].fcount + "</td>" + "<td>" + result[i].people + "</td>" + "</tr>";
      	       }
      		   console.log(result);
      	     }
             table += "</table>";
      	     res.send(table);
     });
   }
  });
});

app.post('/signup', (req, res) => {
  var con = mysql.createConnection(CONNECTIONSTRING);
  console.log(req.body);
  con.connect(function(err) {
  	if(err) throw err;
  	if (req.body.people == "f") {
  	   con.query("SELECT * FROM users_friends WHERE login = '" + req.body.email + "';", function (err, result, fields){
           if (err) throw err;
           console.log(result);
           if(result[0]) {
           	    res.send("Such user already exists! <a href='rentfriend.html''>Ale ty nubasyava</a>");
           } else {
              con.query("INSERT INTO friend (name, surname, price_for_hour) VALUES ('" + req.body.name + "','" + req.body.surname +"'," + "8);", function (err, result, fields){
                 if (err) throw err;
                 console.log(result);
                 con.query("INSERT INTO users_friends (login, password, friend_id) VALUES ('" + req.body.email + "','" + req.body.psw + "','" + result.insertId + "');", function (err, result, fields){
                    if (err) throw err;
                    console.log(result);
                    res.send("User signed up successfully! <a href='login.html'>Good luck, my friend, with login!</a>");
                 });
              });
          }
      });
  	} else if (req.body.people == "c") {
       con.query("SELECT * FROM users_clients WHERE login = '" + req.body.email + "';", function (err, result, fields){
           if (err) throw err;
           console.log(result);
           if(result[0]) {
           	    res.send("Such user already exists! <a href='rentfriend.html''>Ale ty nubasyava</a>");
           } else {
              con.query("INSERT INTO client (name, surname) VALUES ('" + req.body.name + "','" + req.body.surname + "');", function (err, result, fields){
                 if (err) throw err;
                 console.log(result);
                 con.query("INSERT INTO users_clients (login, password, client_id) VALUES ('" + req.body.email + "','" + req.body.psw + "','" + result.insertId + "');", function (err, result, fields){
                    if (err) throw err;
                    console.log(result);
                    res.send("User signed up successfully! <a href='login.html'>Good luck, my friend, with login!</a>");
                 });
              });
          }
      });
  	}
  });
});

app.post('/accountInfoClient', (req,res) =>{
    console.log(req.body);
    var con = mysql.createConnection(CONNECTIONSTRING);
    if (userInfo.length == 0) {
    	res.send("Log in again, please! <a href='login.html'> </a>");
    }
    let user = userInfo[getIdUser(req.body.ip)];
    con.connect(function(err) {
       con.query("SELECT client.id, name, surname, login, password, client_id from mydbright.client" + 
              " INNER JOIN mydbright.users_clients ON mydbright.client.id = mydbright.users_clients.client_id WHERE client.id = " + user.client_id + ";", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/changePasswordClient', (req,res) =>{
    console.log(req.body);
    var con = mysql.createConnection(CONNECTIONSTRING);
    if (userInfo.length == 0) {
    	res.send("Log in again, please! <a href='login.html'> </a>");
    }
    let user = userInfo[getIdUser(req.body.ip)];
    con.connect(function(err) {
       con.query("update users_clients set password =  " + req.body.second + " where client_id = " + user.client_id + ";", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/changePasswordFriend', (req,res) => {
    console.log(req.body);
    var con = mysql.createConnection(CONNECTIONSTRING);
    if (userInfo.length == 0) {
    	res.send("Log in again, please! <a href='login.html'> </a>");
    }
    let user = friendInfo[getIdUser(req.body.ip)];
    con.connect(function(err) {
       con.query("update users_friends set password = " + req.body.second + " where friend_id =  " + user.friend_id + ";", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/accountInfoFriend', (req,res) =>{
    console.log(req.body);
    var con = mysql.createConnection(CONNECTIONSTRING);
    if (friendInfo.length == 0) {
    	res.send("Log in again, please! <a href='login.html'> </a>");
    }
    let user = friendInfo[getIdFriend(req.body.ip)];
    con.connect(function(err) {
       con.query("SELECT friend.id, name, surname, login, password, friend_id from mydbright.friend" + 
              " INNER JOIN mydbright.users_friends ON mydbright.friend.id = mydbright.users_friends.friend_id WHERE friend.id = " + user.friend_id + ";", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

//SIMPLE SELECTS

let notbot_order = {
    group : 0,
   	date : "",
    holiday : "",
    hours : 0,
    price : 0
};

app.post('/getOrdersClient', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("SELECT o.id, o.date, o.hours, o.price, h.name as holiday_name, group_concat(f.name, ' ', f.surname SEPARATOR ', '), f.price_for_hour " + 
                 " FROM _order as o join holiday as h on h.id = o.holiday_id join groups_friends as gf on o.groupf_id = gf.group_id " +  
   	             " join friend as f on f.id = gf.friend_id  where o.client_id = " + userInfo[getIdUser(req.body.ip)].client_id + " group by o.id order by o.id;", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/getOrdersFriend', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("select o.date,o.hours,h.name as holiday,o.price,o.groupf_id,c.name,c.surname from _order as o join groups_friends as gf on gf.group_id = o.groupf_id join holiday as h" + 
                 " on o.holiday_id = h.id join client as c on c.id=o.client_id where gf.friend_id = " + friendInfo[getIdFriend(req.body.ip)].friend_id +";", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/getAllFriends', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("select id, name, surname from friend;", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/getAllClients', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("select id, name, surname from client;", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/getAllPresents', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("select id, name, price from present;", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/getAllHolidays', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("select id, name from holiday;", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
             });
    });
});

app.post('/creatingOrder', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    let idishki = req.body.first.split(' ');
    notbot_order.hours = req.body.second;
    notbot_order.date = req.body.third;
    notbot_order.holiday = req.body.fourth;
    con.connect(function(err) {
       con.query("select max(group_id) as max from groups_friends", (err, result, fields) => {
         if (err) throw err;
         if (result[0]){
             notbot_order.group = parseInt(result[0].max) + 1;
             console.log(notbot_order.group);                            
             idishki.forEach(function(i){
                  con.query("insert into groups_friends (friend_id, group_id) values ('" + i + "', '" + (parseInt(result[0].max) + 1) + "');", (err, result, fields) => {
                    if (err) throw err;
                  });
             });
             queryString = "select sum(price_for_hour) as sum from friend where id in ('";
             idishki.forEach(function(i, idx){
             	 if (idx != idishki.length - 1){
             	 	queryString += i + "' , '";
             	 } else {
                    queryString += i + "');"
             	 }
             })
             con.query(queryString, (err, result, fields) => {
                    if (err) throw err;
                    notbot_order.price = parseInt(result[0].sum)*parseInt(notbot_order.hours);
                    res.send(notbot_order.price.toString());
             });
            }
        });
    });
});

app.post('/agreeOrder', (req,res) => {
	console.log(notbot_order);
    var con = mysql.createConnection(CONNECTIONSTRING);
    if (notbot_order.group === 0 || notbot_order.date === "" || notbot_order.holiday === "" || notbot_order.hours === 0 || notbot_order.price === 0)
    {
    	res.send(" ");
    }
    con.connect(function(err) {
       con.query("insert into _order (date, hours, holiday_id, price, groupf_id, client_id) values ('" + notbot_order.date + "','" + notbot_order.hours + "','" + notbot_order.holiday + 
   	            	   	"','" + notbot_order.price + "','" + notbot_order.group + "','" + userInfo[getIdUser(req.body.ip)].client_id + "');", (err, result, fields) => {
          if (err) throw err;
          notbot_order = {
              group : 0,
              date : "",
              holiday : "",
              hours : 0,
              price : 0
            };
            res.send(" ");
        });
    });
});

app.post('/sendGift', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("insert into client_has_friend (client_id, friend_id, present_id, date) VALUES ('" + userInfo[getIdUser(req.body.ip)].client_id + "', '" + req.body.first + "','" + req.body.second + "','" +
       	(new Date()).toLocaleDateString() + "');", function (err, result, fields) {
           console.log((new Date()).toLocaleDateString())
              	if (err) throw err;
                console.log(result);
                res.send('gift send successfuly... pls go back')
              });
    });
});

app.post('/sendFeedback', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    let idishki = req.body.first.split(' ');
    con.connect(function(err) {
       con.query("select max(groupc_id) as max from groups_clients", (err, result, fields) => {
         if (err) throw err;
         if (result[0]){
             console.log(notbot_order.group);                            
             idishki.forEach(function(i){
                  con.query("insert into groups_clients (client_id, groupc_id) values ('" + i + "', '" + (parseInt(result[0].max) + 1) + "');", (err, result, fields) => {
                    if (err) throw err;
                  });
             });
             con.query("insert into feedback (rate, friend_id, groups_clients_id, description, date) VALUES ('" + req.body.third + "','" + req.body.second + "','" + (parseInt(result[0].max) + 1) + "','" + req.body.fourth + 
             	"','" + (new Date()).toLocaleDateString() + "');", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send('feedback send successfuly... pls go back')
              });
            }
        });
    });
});

app.post('/ShowAllGifts', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("SELECT chf.id, c.name, surname, p.name, chf.date FROM client_has_friend as chf join present as p on p.id = chf.present_id join client as c on c.id = chf.client_id " + 
       	" where chf.friend_id = '" + friendInfo[getIdFriend(req.body.ip)].friend_id + "';", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});

app.post('/returnGift', (req,res) => {
    var con = mysql.createConnection(CONNECTIONSTRING);
    con.connect(function(err) {
       con.query("delete from client_has_friend where id = '" + req.body.first + "';", function (err, result, fields) {
              	if (err) throw err;
                console.log(result);
                res.send(result);
              });
    });
});
//bot
app.get('/botentry', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});


app.post('/botentry', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          Handler(event);
        }
      });
    });
    res.status(200).end();
  }
});

const client = new Wit({accessToken: 'AHNBRZYI5DAKLQIVOOE4I7QXI65HZM2M'});
let QS_ACCESS_TOKEN = 'EAAC78DkJQnABANv6IZAAEDEBPZAaXkglFaaMZCUiDoNOrltYExJJRldr66lPHy6VoWIAGHnAai3Ujtp9hFGoo8tHZAth7pgDPHg5JZAX0dfngIQ939vr3TwQbnADhUo73b5PEc4bwwE9iGuSpk5jWSHlBbtgBG33EzVUlSBM9AwZDZD';
let order = {
   	  group : 0,
   	  date : "",
      holiday : "",
      hours : 0,
      price : 0
};


function Handler(event) {
   let sender = event.sender.id;
   let message = event.message.text;
   var con = mysql.createConnection(CONNECTIONSTRING);
   client.message(message).then((data) => {
      con.connect(function(err){
             con.query("select * from facebook where chat_id = '" + sender + "';", (err, result, fields) => {
             	console.log(data.entities);
                if (err) throw err;
                console.log(result);
                if (!result[0]) {
                	sendMessage(sender, 'Hello! You are the newest one, ma friend, wanna sign up? \n Enter login and password through space.');
                	con.query("insert into facebook (chat_id, state) values ('" + sender + "','signup')", (err, result, fields) => {
                       if (err) throw err;
                    });
                    return
                } 
   	            if (result[0].state === 'signup'){
                   temp = message.split(' ');
                   if (temp.length == 2){
                   	  con.query("select * from users_clients where login = '" + temp[0] + "' and password = '" + temp[1] + "';", (err, res, fields) => {
                        if (err) throw err;
                        if (!res[0])
                        {
                        	sendMessage(sender, 'You entered wrong password or login, try again');
                        } else
                        {

                        	con.query("update facebook set state = 'active', user_cl = " + res[0].client_id + " where id = " + result[0].id + ";", (err, result, fields) => {
                               if (err) throw err;
                               sendMessage(sender, 'Logged up successfully');
                            });
                        }
                      });
                   } else {
                   	 sendMessage(sender, 'String format incorrect, nubasento');
                   }
                   return
   	            }
   	            if (message === "Info"){
   	            	con.query("SELECT o.id, o.date, o.hours, o.price, h.name as holiday_name, f.name, f.surname, f.price_for_hour " +
   	            		"FROM _order as o join holiday as h on h.id = o.holiday_id join groups_friends as gf on o.groupf_id = gf.group_id " + 
   	            		"join friend as f on f.id = gf.friend_id where o.client_id = " + result[0].user_cl + " order by o.id;", (err, response, fields) => {
                       if (err) throw err;
                       console.log(response);
                       let check = 0;
                       resultString = "";
                       response.forEach(function(i){
                       	  if (i.id != check) {
                       	  	resultString += "Id: " + i.id + "; Date: " + i.date.toDateString() + "; Hours: " + i.hours + "; Holiday: " + i.holiday_name + "; Price: " + i.price + "; Friends: " + '\n' + '\t' + 
                       	  	" - Name: " + i.name + "; Surname: " + i.surname + "; Price for hour: " + i.price_for_hour + '\n';
                       	  	check = i.id;
                       	  } else {
                       	  	resultString += '\t' + " - Name: " + i.name + "; Surname: " + i.surname + "; Price for hour: " + i.price_for_hour + '\n';
                       	  }

                       });
                       sendMessage(sender, resultString);
                       return
                    });
   	            }
   	            if (message === "Order a Friend")
   	            {
                    con.query("update facebook set state = 'ordering_friend', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                           if (err) throw err;
                           sendMessage(sender, 'Enter id friends for order. Example: 1 2 3 ');
                      });
                    con.query("select id, name, surname from friend;", (err, result, fields) => {
                           if (err) throw err;
                           resultString = "";
                           result.forEach(function(i) {
                               resultString += "Id: " + i.id + "; Name: " + i.name + "; Surname: " + i.surname + '\n';
                           });
                           sendMessage(sender, resultString);
                      });
   	            }
   	            if (result[0].state === 'ordering_friend'){
   	            	let temp = message.split(' ');
   	            	con.query("select max(group_id) as max from groups_friends", (err, result, fields) => {
                         if (err) throw err;
                         if (result[0]){
                            order.group = parseInt(result[0].max) + 1;
                            console.log(order.group);                            
                           	temp.forEach(function(i){
                                 con.query("insert into groups_friends (friend_id, group_id) values ('" + i + "', '" + (parseInt(result[0].max) + 1) + "');", (err, result, fields) => {
                                  if (err) throw err;
                                 });
                            });
                         }
                    });
                    con.query("update facebook set state = 'ordering_date', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                           if (err) throw err;
                           sendMessage(sender, 'Success. Enter date (example 2018-03-05).');
                    });
   	            }
   	            if (result[0].state === 'ordering_date'){
   	            	let temp = message.split('-');
   	            	if (temp.length === 3) {
   	            		order.date = message;
   	            		con.query("update facebook set state = 'ordering_hours', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                           if (err) throw err;
                           sendMessage(sender, 'Success. Enter number of hours.');
                        });
   	            	} else
   	            	{
   	            		sendMessage(sender, 'Bad date, try again.');
   	            	}
   	            }
   	            if (result[0].state === 'ordering_hours'){
   	                order.hours = message;
   	            	con.query("update facebook set state = 'ordering_holiday', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                           if (err) throw err;
                           sendMessage(sender, 'Success. Enter holiday id.');
                       });
   	            	con.query("select * from holiday;", (err, result, fields) => {
                           if (err) throw err;
                           resultString = "";
                           result.forEach(function(i){
                              resultString += "Id: " + i.id + "; Name: " + i.name + '\n';
                           });
                           sendMessage(sender, resultString);
                       });
   	            }
   	            if (result[0].state === 'ordering_holiday'){
   	            	if (isNaN(message)){
   	            		sendMessage(sender, 'Bad. Enter number.');
   	            	} else {
   	                  order.holiday = message;
   	            	  con.query("update facebook set state = 'ordering_price', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                           if (err) throw err;
                           sendMessage(sender, 'Success. Calculating price.');
                       });
   	                } 
   	            }
   	            if (result[0].state === 'ordering_price'){
   	            	console.log(order.group);
   	            	con.query("select sum(price_for_hour) as sum from friend join groups_friends on friend.id = groups_friends.friend_id where groups_friends.group_id = " + order.group + ";", (err, result, fields) => {
                           if (err) throw err;
                           console.log(result);
                           order.price = parseInt(result[0].sum) * parseInt(order.hours);
                           sendMessage(sender, 'Success. Your price is: ' + order.price + '. Do you confirm Y/N?');
                       });
   	            	con.query("update facebook set state = 'confirm', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                           if (err) throw err;
                       });
   	            }
   	            if (result[0].state === 'confirm'){
   	            	console.log(data.entities.intent[0].value);
   	            	if (data.entities.intent[0].value === "Yes") {
   	            	   con.query("insert into _order (date, hours, holiday_id, price, groupf_id, client_id) values ('" + order.date + "','" + order.hours + "','" + order.holiday + 
   	            	   	"','" + order.price + "','" +  order.group + "','" + result[0].user_cl + "');", (err, resultative, fields) => {
                           if (err) throw err;
                           sendMessage(sender, 'Success. Your order confirmed.');
                           con.query("update facebook set state = 'active', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                              if (err) throw err;
                              order = {
   	                            group : 0,
   	                            date : "",
                                holiday : "",
                                hours : 0,
                                price : 0
                             };
                           });
                       });
   	                } else if (data.entities.intent[0].value === "No") {
   	                   con.query("update facebook set state = 'active', user_cl = " + result[0].user_cl + " where id = " + result[0].id + ";", (err, result, fields) => {
                           if (err) throw err;
                           order = {
   	                        group : 0,
   	                        date : "",
                            holiday : "",
                            hours : 0,
                            price : 0
                           };
                           sendMessage(sender, 'Okay, choose another option.');
                       });
   	                }
   	            }
   	            if (data.entities.intent && result[0].state === 'active' && data.entities.intent[0].value === "Greetings") {
                    sendQuickReply(sender, 'Hello, how its going?', 'active');
                    return
   	            }
             });
        });       
  });
}

function sendMessage(sender, message) {
	request({
     url: 'https://graph.facebook.com/v2.6/me/messages',
     qs: {access_token: QS_ACCESS_TOKEN},
     method: 'POST',
     json: {
       recipient: {id: sender},
       message: {text: message}
     }
   }, function (error, response) {
     if (error) {
         console.log('Error sending message: ', error);
     } else if (response.body.error) {
         console.log('Error: ', response.body.error);
     }
   });
}

function sendQuickReply(sender, text, state) {
	if(state == 'active'){
      message = {text: text,
                 'quick_replies': [
                   {
                     "content_type":"text",
                     "title":"Info",
                     "payload":"<ACCOUNT_INFO_PAYLOAD>"
                   },
                   {
                     "content_type":"text",
                     "title":"Order a Friend",
                     "payload":"<CHANGE_ACCOUNT_PAYLOAD>"
                   }
                 ]};
   }
	request({
     url: 'https://graph.facebook.com/v2.6/me/messages',
     qs: {access_token: QS_ACCESS_TOKEN},
     method: 'POST',
     json: {
       recipient: {id: sender},
       message: JSON.stringify(message)
     }
   }, function (error, response) {
     if (error) {
         console.log('Error sending message: ', error);
     } else if (response.body.error) {
         console.log('Error: ', response.body.error);
     }
   });
}

//get-methods
app.get('/login', (req, res) => {
  res.sendFile(("login.html"), {
  	root: __dirname
  });
});

app.get('/signup', (req, res) => {
  res.sendFile(("signup.html"), {
  	root: __dirname
  });
});

app.get('/', (req, res) => {
  res.sendFile(("rentfriend.html"), {
  	root: __dirname
  });
});

app.get('/rentfriend.html', (req, res) => {
  //if (err) console.log(err);
  res.sendFile(("rentfriend.html"), {
  	root: __dirname
  });
});

app.get('/login.html', (req, res) => {
  res.sendFile(("login.html"), {
  	root: __dirname
  });
});

app.get('/signup.html', (req, res) => {
  res.sendFile(("signup.html"), {
  	root: __dirname
  });
});


//files
app.get('/opastyle.css', function(req, res) {
  res.sendFile(__dirname + "/" + "opastyle.css");
});

app.get('/logo.png', (req, res) => {
  res.sendFile(__dirname + "/" + "logo.png");
});

app.get('/friendlogo.png', (req, res) => {
  res.sendFile(__dirname + "/" + "friendlogo.png");
});

app.get('/yellow_one3.jpg', (req, res) => {
  res.sendFile(__dirname + "/" + "yellow_one3.jpg");
});

app.get('/icon.png', (req, res) => {
  res.sendFile(__dirname + "/" + "icon.png");
});

app.get('/1.jpg', (req, res) => {
  res.sendFile(__dirname + "/" + "1.jpg");
});

app.get('/2.jpg', (req, res) => {
  res.sendFile(__dirname + "/" + "2.jpg");
});

app.get('/3.jpg', (req, res) => {
  res.sendFile(__dirname + "/" + "3.jpg");
});

app.get('/slide.css', (req, res) => {
  res.sendFile(__dirname + "/" + "slide.css");
});

app.get('/slideshow.css', (req, res) => {
  res.sendFile(__dirname + "/" + "slideshow.css");
});


app.get('*', (req, res) => {
  res.redirect('/');
});


