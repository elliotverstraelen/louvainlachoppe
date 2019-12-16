const express = require('express');
const consolidate = require('consolidate');
const app = express ();
const MongoClient = require("mongodb").MongoClient;
const engines = require('consolidate');
const session = require('express-session');
const { check, validationResult } = require('express-validator');
var bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


app.engine('html', consolidate.hogan);
app.set('view engine', 'html');
app.set('views', 'static');
app.use(express.static('static'));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Epress Session MiddleWare
app.use(session(
{
	secret: "lol", 
	resave: false,
	saveUninitialized: true,

	cookie: {
	path: '/',
	httpOnly: true,
	maxAge: 3600000
 	}

}));


var url = "mongodb://localhost:27017/";


/* ------------------------ FUNCTION ------------------------- */

		/* -- function get_star -- */
		function get_star(note)
		{
			var note_star = "none";
			if(note >= 0.0 && note < 0.5)
			{
				note_star = "☆☆☆☆☆";
			}
			else if(note >= 0.5 && note < 1.5)
			{
				note_star = "★☆☆☆☆";
			}
			else if(note >= 1.5 && note < 2.5)
			{
		    	note_star = "★★☆☆☆";
			}
			else if(note >= 2.5 && note < 3.5)
			{
				note_star = "★★★☆☆";
			}
			else if(note >= 3.5 && note < 4.5)
			{
				note_star = "★★★★☆";
			}
			else if(note >= 4.5 && note <= 5.0)
			{
				note_star = "★★★★★";
			}
			else
			{
				note_star = "note_error"
			}
			return note_star;
		}
		/* -- function get_star -- */

		/* -- function Homepage -- */
		function mainPage(req, res, table_1, table_2, table_3, Beerforyou){
			var Connexion;
			var Pseudo_user;
			var history;
			if (req.session.username){
				Connexion = "Se déconnecter";
				Pseudo_user = req.session.username;
				history = "Historique";
			}
			else{
				Connexion = "Connexion";
				Pseudo_user = "";
				history = "";
			}

			
			res.render('home_page.html', {connexion: Connexion, pseudo_user: Pseudo_user, table_html1 : table_1, table_html2 : table_2, table_html3 : table_3, Beerforyou : Beerforyou, history : history});
		}
		/* -- function Homepage -- */

		/* -- Tri de liste par beer_name -- */
		function tri(a,b)
		{
			if (a.beer_name < b.beer_name) return -1;
			else if (a.beer_name == b.beer_name) return 0;
			else return 1;
		}
		/* -- Tri de liste par beer_name -- */

/* ------------------------ FUNCTION_END ------------------------- */


/* --------------------- HOME-PAGE ---------------------- */

		/* -- HomePage -- */
		app.get('/', function(req, res)
		{
			MongoClient.connect(url, function(error, db)
			{
				if(error)
				{
					console.log("error! Can't Connect to MongoDB!");
				}

				else
				{
					var dbo = db.db("Beer");
					var dbo_users = db.db("users");
					var table_1 = [];
					var table_2 = [];
					var table_3 = [];
					var used_beer_type = "Blonde";
					var used_beer_degree = "5.0 < 8.5";
					var Beerforyou = "Bières pour vous:";

					if(req.session.username)
					{	
						dbo_users.collection("profil").findOne({user: req.session.username},function(error3, res3)
						{
							if(error3)
							{
								console.log("error3");
								mainPage(req, res, "table_1", "table_2", "table_3", "Beerforyou");
							}
							else	
							{
								used_beer_type = res3.pro_beer_type;
								used_beer_degree = res3.pro_beer_degree;
							}
						});
					}

					dbo.collection("List").find({}).toArray(function(error2, res2)
					{

						if(error2)
							{
								console.log("error2");
								mainPage(req, res, "table_1", "table_2", "table_3", "Beerforyou");
							}
						else
						{
							db.close();

							var table1 = [];
							var table2 = [];
							var table3 = [];

							

							for(var obj in res2)
							{
								note_star = get_star(res2[obj].note);
								if(res2[obj].type == used_beer_type && res2[obj].degree == used_beer_degree)
								{
									table2.push({youBeer: res2[obj].name, beer_note: note_star});
								}
								table1.push({newBeer: res2[obj].name, beer_note: note_star});
								table3.push({topBeer: res2[obj].name, beer_note: res2[obj].note});
							}

							table1.reverse();
							table2.reverse();
							table3.sort(((a, b) => a.beer_note - b.beer_note));
							table3.reverse();

							if(table2.length == 0)
							{
								Beerforyou = "Malheureusement, nous n'avons trouvé aucune bière pour vous ...";
							}
							for(var obj in table3)
							{
								table3[obj].beer_note = get_star(table3[obj].beer_note);
							}

							var for_end = 5;
							for(var i = 0; i < for_end; i++)
							{
									table_1.push(table1[i]);
									table_2.push(table2[i]);
									table_3.push(table3[i]);
							}

							mainPage(req, res, table_1, table_2, table_3, Beerforyou);
						}

					});
				}
			});
		});
		/* -- HomePage -- */

/* --------------------- HOME-PAGE_END --------------------- */


/* ---------------------- SEARCH -------------------------- */
app.get('/search', function(req, res){

	var Connexion;
	var Pseudo_user;
	var history;
	if (req.session.username){
		Connexion = "Se déconnecter";
		Pseudo_user = req.session.username;
		history = "Historique";
	}
	else{
		Connexion = "Connexion";
		Pseudo_user = "";
		history = "";
	}

	MongoClient.connect(url, function(error, db){

		if(error)
		{
			console.log("/search/error");
			res.redirect('/search');
		}

		var dbo = db.db("Beer");
		dbo.collection("List").find({}).toArray(function(error2, res2){

			if(error2)
			{
				console.log("/search/error2");
				res.redirect('/search');
			}
			else
			{
				var search_maj = (req.query.search).toUpperCase();
				var search_word = search_maj.split(' ');
				var search_tir = search_maj.split('-');
				var search_char = search_maj.split('');

				var already = 0;

				db.close();
							
				var table1 = [];
				for(var obj in res2)
				{
					var name_maj = (res2[obj].name).toUpperCase();
					var name_word = name_maj.split(' ');
					var name_tir = name_maj.split('-');
					var name_char = name_maj.split('');
					var already = 0;

					var bar_maj = (res2[obj].bar).toUpperCase();
					var bar_word = bar_maj.split(' ');
					var bar_tir = bar_maj.split('-');

					var same_char = 0;

					if(name_maj === search_maj || bar_maj === search_maj && already == 0)
					{
						note_star = get_star(res2[obj].note);
						table1.push({beer_name: res2[obj].name, beer_note: note_star, beer_add: res2[obj].user, beer_bar: res2[obj].bar});
						already ++;
					}

					if(already == 0)
					{
						for(var obj2 in name_word)
						{
							for(var obj3 in search_word)
							{
								if(name_word[obj2] === search_word[obj3] || name_tir[obj2] === search_tir[obj3] && (search_tir[obj3] != undefined ||  name_tir[obj2] != undefined))
								{
									if(already == 0)
									{
										note_star = get_star(res2[obj].note);
										table1.push({beer_name: res2[obj].name, beer_note: note_star, beer_add: res2[obj].user, beer_bar: res2[obj].bar});
										already++;
									}
								}
							}
						}
					}
					if(already == 0)
					{
						if(search_word.length == 1)	
						{
							var j = 0
							var stop = 0
							for(var i = 0; i < name_maj.length; i++)
							{
									
									if(name_maj[i] == search_maj[j] || bar_maj[i] == search_maj[j])
									{
										j++
										same_char++
									}

									else
									{
										same_char = 0;
										j = 0;
									}				
									if(same_char >= 3)
									{
										note_star = get_star(res2[obj].note);
										table1.push({beer_name: res2[obj].name, beer_note: note_star, beer_add: res2[obj].user, beer_bar: res2[obj].bar});
										break
									}
							}
						}
						else if(name_tir.length >= 2)
						{
							var j = 0
							var stop = 0
							var stop2 = 0
							var same_word = 0
							var same_char = 0

							for(var u = 0; u < name_tir.length; u++)
							{
								if(stop2 > 0)
								{
									break
								}
								for(var i = 0; i < name_tir[u].length; i++)
								{
										

										if((name_tir[u])[i] == (search_word[u])[j])
										{
											j++
											same_char++
										}

										else
										{
											same_char = 0;
											j = 0;
										}
												
										if(same_char >= 3)
										{	
											j = 0
											same_word++
											if(same_word >= search_word.length)
											{
												note_star = get_star(res2[obj].note);
												table1.push({beer_name: res2[obj].name, beer_note: note_star, beer_add: res2[obj].user, beer_bar: res2[obj].bar});
												stop2++
											}
											break
										}
								}
							}
						}
						
						
					}
				
				}
				table1.reverse()
				console.log("Search for <" + req.query.search + "> ...")
				res.render('search_page.html', {connexion: Connexion, pseudo_user: Pseudo_user, table_html1 : table1, search_content: req.query.search})
			}
		});
	});


});
/* ---------------------- SEARCH_END -------------------------- */



/* ---------------------- LIST --------------------------*/

		/* -- button list_page -- */
		app.get('/list_page', function(req, res)
		{
				var Connexion = "Se déconnecter";
				var Pseudo_user = req.session.username;

				MongoClient.connect(url, function(error, db){
					if(error)
					{
						console.log("/list_page/error");
						res.redirect('/listpage');
					}
					var dbo = db.db("Beer");
					dbo.collection("List").find({}).toArray(function(error2, res2){
						if(error2)
						{
							console.log("/list_page/error2");
							res.redirect('/listpage');
						}
						else
						{
							db.close();
							
							var table1 = [];
							for(var obj in res2)
							{
								note_star = get_star(res2[obj].note);
								table1.push({beer_name: res2[obj].name, beer_degree: res2[obj].degree, beer_bar: res2[obj].bar, nVote: res2[obj].nVote, beer_type: res2[obj].type, beer_note: note_star, brasserie: res2[obj].brasserie, user: res2[obj].user});
							}
							table1.reverse()
							table1.sort(tri);
							if(req.session.username)
							{	
								var Connexion = "Se déconnecter";
								var Pseudo_user = req.session.username;
							}
							else
							{
								var Connexion = "Se connecter";
								var Pseudo_user = "";
							}
							res.render('list_page.html', {connexion: Connexion, pseudo_user: Pseudo_user, table_html1 : table1})
						}
					});
				});
		});
		/* -- button list_page -- */

/* ---------------------- LIST --------------------------*/



/* ----------------- HISTORY ------------------- */

		/* -- button history_page -- */
		app.get('/history_page', function(req, res)
		{
			if (req.session.username)
			{
				var Connexion = "Se déconnecter";
				var Pseudo_user = req.session.username;

				MongoClient.connect(url, function(error, db){
					var dbo = db.db("history");
					dbo.collection(req.session.username).find({}).toArray(function(error2, res2){
						if(error2)
						{
							console.log("/history_page/error2");
							res.redirect('/history_page');
						}
						else
						{
							db.close();
							
							var table1 = [];
							for(var obj in res2)
							{
								note_star = get_star(res2[obj].note);
								table1.push({beer_name: res2[obj].name, beer_note: note_star, commentaire: res2[obj].commentaire, add: res2[obj].add});
							}
							table1.reverse()
							res.render('history_page.html', {connexion: Connexion, pseudo_user: Pseudo_user, table_html1 : table1})
						}
					});
				});
			}
			else
			{
				res.render("login_page.html");
			}
		});
		/* -- button history_page -- */

/* ----------------- HISTORY_END ------------------- */



/* ----------------- PROFIL ----------------- */

			/* -- set profil_page -- */
			app.get('/profil_page', function(req, res)
			{	
			    Connexion = "Se déconnecter";
			    var Pseudo_user;
				var profil_mdp;
				var pro_beer_type;
				var pro_beer_degree;

				if (req.session.username)
				{
					MongoClient.connect(url, function(error, db){
						if(error) 
							{
								res.redirect('/profil_page');
							}
							else
							{
								if(req.session.username)
				    			{
				    				var dbo = db.db("users");
									dbo.collection("users").findOne({user: req.session.username},function(error2, res2)
									{
										if(error2) 
										{
											res.redirect('/profil_page');
										}
										Pseudo_user = res2.user;
										profil_mail = res2.mail;

										dbo.collection("profil").findOne({user: req.session.username},function(error3, res3)
										{
											if(error3) 
											{
												res.redirect('/profil_page');
											}
											pro_beer_type = res3.pro_beer_type;
											pro_beer_degree = res3.pro_beer_degree;
											db.close()
											res.render('profil_page.html', {connexion: Connexion, pseudo_user: Pseudo_user, profil_name: Pseudo_user, profil_mail: profil_mail, profil_beerType: pro_beer_type, profil_degree: pro_beer_degree});
										});
									});
								}		
								
				    		}	
					});
				}
				else{
					res.redirect('/');
				}
			    
			});
			/* -- set profil_page -- */

/* ----------------- PROFIL_END ----------------- */



/* ----------------- DOPROFIL ----------------- */

			/* -- doProfil_Button --*/
			app.get('/doProfil_page', function(req, res)
			{
				if(req.session.username)
				{
					Connexion = "Se déconnecter";
					Pseudo_user = req.session.username;

					res.render('doProfil_page.html', {connexion: Connexion, pseudo_user: Pseudo_user})
				}
				else
				{
					res.render('login_page.html');
				}
			});
			/* -- doProfil_Buttom -- */


			/* -- set doProfil_page -- r*/
			app.get('/sendProfil', function(req, res)
			{
				if(req.session.username)
				{
					if(req.query.pro_beer_type != " " && req.query.pro_beer_degree != " " && req.query.pro_beer_note != " ")
					{
						MongoClient.connect(url, function(error, db)
						{
							if(error) 
							{
								res.redirect('/doProfil_page');
								throw error;
							}
							else
							{
								var dbo = db.db("users");
					            
								dbo.collection("profil").findOne({user:req.session.username}, function(error2, res2)	
								{
									if(res2 == null)
									{
										dbo.collection("profil").insertOne({user:req.session.username, pro_beer_type:req.query.pro_beer_type, pro_beer_degree:req.query.pro_beer_degree, pro_beer_note:req.query.pro_beer_note}, function(error3, res3)
										{
											db.close();

											if(error3)
											{
												res.redirect('/doProfil_page');
											}
											else
											{
												console.log(req.session.username + "'s profil updated")
												res.redirect('/');
											}
										});
									}
									else
									{
										dbo.collection("profil").update({user:req.session.username}, {user:req.session.username, pro_beer_type:req.query.pro_beer_type, pro_beer_degree:req.query.pro_beer_degree, pro_beer_note:req.query.pro_beer_note}, function(error3, res3)
										{
											db.close();

											if(error3)
											{
												res.redirect('/doProfil_page');
											}
											else
											{
												res.redirect('/');
											}
										});
									}
								});						
							}

						});
					}
					else
					{
						res.redirect('/')
					}
				}
				else
				{
					res.render('login_page.html');
				}
			});
			/*Profil_Folder*/

/* ----------------- DOPROFIL_END ----------------- */




/* ------------------- ADD_BEER --------------------- */

			/*Buttom_addBeer*/
			app.get('/addBeer_page', function(req, res)
			{
				var exist = "";
				if(req.session.username)
			    {
			    	Pseudo_user = req.session.username;

			    	res.render('addBeer_page.html', {pseudo_user: Pseudo_user, exist : exist});
			    }
			    else
			    {
			    	res.render('login_page.html');
			    }
			});
			/*Buttom_addBeer*/


			/*Add an Beer_Folder*/
			app.get('/add_beer', function(req,res)
			{
				if(req.session.username)
				{
					MongoClient.connect(url, function(error, db)
					{
						if(error)
						{
							res.redirect('/addBeer_page');
						}
						else
						{
								
								var dbo = db.db("Beer");
					          
								dbo.collection("List").findOne({name:req.query.beer_name}, function(error2, res2)	
								{
									if(res2 == null)
									{
										dbo.collection("List").insertOne({user:req.session.username, name: req.query.beer_name, type: req.query.beer_type, note: req.query.beer_note, bar: req.query.beer_bar, brasserie: req.query.beer_brasserie, degree: req.query.beer_degree, nVote: 1}, function(error3, res3)
										{
											

											if(error3)
											{
												res.redirect('/addBeer_page');
											}
											else
											{	

												var dbo2 = db.db("history");

												dbo2.collection(req.session.username).insertOne({name:req.query.beer_name, note: req.query.beer_note, commentaire: req.query.beer_commentaire, add: "✓"}, function(error3, res3)	
												{
												
													
												});

												var dbo3 = db.db("comment");

												dbo3.collection(req.query.beer_name).insertOne({username:req.session.username, commentaire: req.query.beer_commentaire}, function(error4, res4)	
												{
													
												});

												db.close()
												console.log("Beer: " + req.query.beer_name + " added by " + req.session.username)
												res.redirect('/');
											}
										});
									}
									else
									{
										db.close()
										var exist = "Cette bière existe déja..."
										var pseudo_user = req.session.username;
										console.log("Beer: " + req.query.beer_name + ", already exist")
										res.render('addBeer_page.html', {pseudo_user: Pseudo_user, exist : exist});
									}
								});		
								
						}
					});
				}
				else
				{
					res.render('login_page.html');
				}	
			});
			/*Add an Beer_Folder*/

/* ------------------- ADD_BEER_END --------------------- */



/* ------------------- BEER_DESCRIPTION --------------------- */

			/*Button_Beer_description*/
			app.get('/beer_description', function (req, res){

				MongoClient.connect(url, function(error, db)
				{
					if(error) throw error;

					else
					{
						var table1 = [];
						var name;
						var type;
						var degree;
						var bar;
						var brasserie;
						var note;
						var comentaire;

						var dbo2 = db.db("comment");
								
						dbo2.collection(req.query.name).find({}).toArray(function(error3, res3){
							if(error3)
							{
								console.log("/beer_description/error3");
								res.redirect('/history_page');
							}
							else
							{
								db.close();
								for(var obj in res3)
								{
									if (res3[obj].commentaire != "") 
									{
										table1.push({commentaire: res3[obj].commentaire, author: res3[obj].username});
									}
								}
								table1.reverse()
							}
						});


						var dbo = db.db("Beer");
						dbo.collection("List").findOne({name: req.query.name},function(error2, res2)
						{
							if(error2){
								console.log("/beer_description/error2");
								res.redirect('/beer_description');
							}
							else{
								name = res2.name;
								type = res2.type;
								degree = res2.degree;
								bar = res2.bar;
								brasserie = res2.brasserie;
								note = get_star(res2.note);

								res.render('beerDescription_page.html', {name: name, type: type, note: note, bar : bar, brasserie : brasserie, table_html1 : table1, degree: degree});
							}
						});
					}

				});
			});
			/*Button_Beer_description*/

/* ------------------- BEER_DESCRIPTION_END --------------------- */



/* -------------------- ADD_COM_NOTE ----------------------- */

			/* -- add-commentaire-note -- */
			app.get('/add_com_note', function(req, res)
			{
				if(req.session.username)
				{
					MongoClient.connect(url, function(error, db)
					{

						if(error)
						{
							console.log("/add_com_note/error");
							res.redirect('/beer_description')
						}
						else
						{
							var username = String(req.session.username);
							var dbo1 = db.db("history");

							dbo1.collection(username).findOne({name:req.query.beer_name}, function(error2, res2)
							{
								if(error2)
								{
									console.log("/add_com_note/error2");
									res.redirect('/beer_description')
								}

								if(!res2)
								{
									dbo1.collection(username).insertOne({name:req.query.beer_name, note: req.query.beer_note, commentaire: req.query.commentaire, add: "✗"}, function(error3, res3)
									{
										db.close();

										if(error3)
										{
											console.log("/add_com_note/error3");
											res.redirect('/beer_description')
										}
									});
								}
								else
								{
									dbo1.collection(username).updateOne({name:req.query.beer_name},{$set : {note: req.query.beer_note, commentaire: req.query.commentaire}}, function(error3, res3)
									{
										db.close();

										if(error3)
										{
											console.log("/add_com_note/error3");
											res.redirect('/beer_description')
										}
									});
								}
							});

						
							var dbo2 = db.db("Beer");

							dbo2.collection("List").findOne({name:req.query.beer_name}, function(error2, res2)
							{
								if(error2)
								{
									console.log("/add_com_note/error2");
									res.redirect('/beer_description')
								}
								else
								{
									var req_note = parseFloat(req.query.beer_note);
									var note_Calculated = (req_note + (parseFloat(res2.note)*res2.nVote))/(res2.nVote + 1);
									var note_Round = Math.round(note_Calculated*100)/100;

									dbo2.collection("List").updateOne({name:req.query.beer_name},{$set : {note: note_Round, nVote: res2.nVote+1}}, function(error3, res3)
									{
										db.close();

										if(error3)
										{
											console.log("/add_com_note/error3");
											res.redirect('/beer_description')
										}
										else
										{
										console.log("Note for " + req.query.beer_name+ " updated by " + username)
										res.redirect('/');
										}
									});
								}
							});

							var dbo3 = db.db("comment");

							dbo3.collection(req.query.beer_name).insertOne({username:req.session.username, commentaire: req.query.commentaire}, function(error2, res2)	
							{
								db.close();
							});	
						}

					});
				}
				else
				{
					res.render('login_page.html');
				}
			});
			/* -- add-commentaire-note -- */

/* -------------------- ADD_COM_NOTE_END ----------------------- */


/* ---------------------- CONNECT/INSCRIPTION --------------------- */



			/*Connexion_Folder*/
			app.get('/Connect', function(req, res){
				res.render('login_page.html')
			})

			app.post('/Connect', function(req,res)
			{
				var doProfil = 0;
				MongoClient.connect(url, function(error, db)
				{
					if(error)
					{
						console.log("Can't connect to mongodb");

						res.render('login_page.html');
					}
					else
					{	
						var dbo = db.db("users");
						dbo.collection("profil").findOne({user : req.body.pseudo}, function(error1, res1)
						{
							if(error1)
							{
								console.log("Connect/error1");
								res.redirect('/Connect')
							}
							else
							{
								if(res1 == null)
								{
									doProfil++
								}
							}
						});
						dbo.collection("users").findOne({user : req.body.pseudo}, async function(error2, res2)
						{
							db.close();
							if (error2)
							{
								console.log("Connection Error. User "+ req.body.pseudo +" not found!");
								res.render("login_page.html", { username_error: "Utilisateur non trouvé!"})
							}
							else
							{
								bcrypt.compare(req.body.mdp, res2.hashed_password).then((result)=>{
								  if(result && res2){
								    console.log("authentication successful")
								    req.session.username = req.body.pseudo;
									if(doProfil == 0)
									{
										res.redirect('/');
									}
									else
									{
										res.redirect('doProfil_page')
									}

								  } else {
								    console.log("authentication failed. Password doesn't match")
								    res.render("login_page.html", {passw_error: "Mot de passe incorrect!"})
								  }
								})
								.catch((err)=>console.error(err))
							}
						});
					}
				});
			});
			/*Connexion_Folder*/
			/* PASSWORD FORGOTTEN */
			app.get('/ResetPassword', function (req, res) {
				res.render('resetPassword.html');
			})
			app.post('/ResetPassword', function (req, res) {
				res.send('Password resetting has not been implemented yet!')
				//this function can be implemented with nodemailer. part of the code can be copy/pasted from /modifyPassword route.
			})

			/* CHANGE PASSWORD */
			app.get('/modifyPassword', function(req, res){
				res.render('modifyPassword.html');
			});

			app.post('/modifyPassword', 
				[
				check('new_passw', "Mot de Passe invalide ! Le mot de passe doit contenir au moin 6 caractères")
					.not().isEmpty()
					.isLength({ min: 6}),
				check('new_passw_check', "Les Mots de passes ne correspondent pas!")
					.custom((value, {req}) => (value == req.body.new_passw))
				], function(req, res){
					const errors = validationResult(req).array();
					console.log(errors);
					console.log("current password: " + req.body.current_passw);
					console.log("current session username: " + req.session.username);

					MongoClient.connect(url, function(error, db)
				{
					if(error)
					{
						console.log("error line 1004. Can't acces MongoDB");
						res.render('modifyPassword.html');
					}
					else
					{	
						var dbo = db.db("users");
						console.log("searching for user: " + req.session.username)
						//redirige la page vers le login si l'utilsateur n'est pas logged in.
						if (typeof req.session.username == 'undefined'){
							res.status(401).render('login_page.html', { other_error: "Please Login First" })
						}

						dbo.collection("users").findOne({user : req.session.username}, async function(error2, res2) {
							db.close();
							if (error2)
							{
								console.log("changePassw error line 1014");
								console.log("session username: " + req.session.username)
								res.render("login_page.html")
							}
							else
							{
								//bcrypt compare le mot de passe actuel envoyé pas l'utilsateur avec celui de la base de donnée
								bcrypt.compare(req.body.current_passw, res2.hashed_password, async function (error5, res5) {
									if(error5){
										console.log("error bcypt compare line 1020");
										console.log("Password entered: " + req.body.current_passw);
										console.log("hash compared: " + res2.hashed_password)
									}
								  	if(res5 && res2){
								  		//
									    console.log("password entered matches database for user " + req.session.username)
									    //hash password
									    var salt = await bcrypt.genSalt(10);
										var hashed_password = await bcrypt.hash(req.body.new_passw, salt);
										dbo.collection("users").updateOne({ user: req.session.username }, { $set: { hashed_password: hashed_password }}, function(error3, res3)
										{
											db.close();
											if(error3){
												console.log("updateOne function failed. Line 1027")
												console.log("user: "+req.session.username)
												console.log("replacing " + res2.hashed_password+ " with "+ hashed_password)
												console.log("updateOne function doesn't work. Line 1046!")
												res.send("updateOne function doesn't work. Line 1046!")
											} else {
												res.redirect('/Profil_page');
											}
										});

								  } else {
								    console.log("Password doesnt match database ")
								    res.render('modifyPassword.html', { wrong_passw_error: "Mot de passe incorrect." });

								  }
								});
							}
						});
					}
				});

					var passw_error = ""
					var passw_check_error = ""
					var wrong_passw_error = ""

					for(var i = 0; i < errors.length; i++){

					if(errors[i].param == "new_passw")
					{
						new_passw_error = errors[i].msg;
					}
					if(errors[i].param == "new_passw_check")
					{
						new_passw_check_error = errors[i].msg;
					}
				}
				if (!errors.length == 0) {
					console.log(errors)
					res.render('modifyPassword.html', { new_passw_error: new_passw_error, new_passw_check_error: new_passw_check_error });

				}

			});



			/*Buttom_Connexion*/
			app.get('/connexion', function(req, res)
			{

				if(req.session.username)
				{
					req.session.username = undefined;
					res.redirect('/');
				}else
				{
					res.render('login_page.html');
				}
			});
			/*Buttom_Connexion*/


			/*Inscription_Folder*/
			app.post('/Create',
				[
				check('user', "Nom d'utilisateur doit contenir au moins 5 caractères")
					.not().isEmpty()
					.isLength({min: 5}),
				check('mail', "Adresse email invalide !")
					.isEmail()
					.normalizeEmail(), 
				check('mdp2', "Mot de Passe invalide ! Le mot de Passe doit contenir au moins 6 caractères")
					.not().isEmpty()
					.isLength({ min: 6 }),
				check('check_mdp2', "Les Mots de passes ne correspondent pas")
					.custom((value, {req}) => (value == req.body.mdp2))
				], function (req, res) {
				
				const errors = validationResult(req).array();
				console.log(errors);

				var user_error = "";
				var mail_error =  "";
				var password_error = "";
				var checkPassword_error = "";

				for(var i = 0; i < errors.length; i++)
				{
					if(errors[i].param == "user")
					{
						user_error = errors[i].msg;
					}
					if(errors[i].param == "mail")
					{
						mail_error = errors[i].msg;
					}
					if(errors[i].param == "mdp2")
					{
						password_error = errors[i].msg;
					}
					if(errors[i].param == "check_mdp2")
					{
						checkPassword_error = errors[i].msg;
					}
				}
					

				if (!errors.length == 0) {
					console.log(errors)
					//return res.status(422).json({ errors: errors.array() });
					res.render('login_page.html', {user_error: user_error, mail_error: mail_error, password_error: password_error, checkPassword_error: checkPassword_error});
				}

				

				else {
					MongoClient.connect(url, function(error, db)
					{
						if(error) 
						{
							res.render('login_page.html');
							console.log("Create/error");
						}
						else
						{
							var dbo = db.db("users");
				            
							dbo.collection("users").findOne({user : req.body.user}, async function(error2, res2)
							{

								if(error2)
								{
									db.close();
									res.render('login_page.html');
								}
								else
								{
									if(!res2)
									{
										//secure data with bcrypt

										var salt = await bcrypt.genSalt(10);
										var hashed_password = await bcrypt.hash(req.body.mdp2, salt);
										console.log(hashed_password);
										dbo.collection("users").insertOne({user:req.body.user, hashed_password: hashed_password, nomcomplet:req.body.nomcomplet, mail:req.body.mail}, function(error3, res3)
										{
											db.close();


											if(error3)
											{
												res.render('login_page.html');
											}
											else
											{
											req.session.username = req.body.user;
											res.redirect('/doProfil_page');
											}
										});
									}
									else
									{
										db.close()
										console.log("Error: 'Same User_Name'")
										res.render("login_page.html", { user_error: "Nom d'utilisateur deja prit!" });
									}
								}
							});
						}

					});
				}

			});
			/*Inscription_Folder*/

/* ---------------------- CONNECT/INSCRIPTION_END --------------------- */




/*Server_Listen*/
console.log("Server is running on port '8080' ...")
app.listen(8080);
/*Server_Listen*/
