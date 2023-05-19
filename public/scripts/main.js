// https://rose-surveys.web.app
var rhit = rhit || {};

rhit.FB_COLLECTION_SURVEYS = "Surveys";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_QUESTIONS = "questions";
rhit.FB_KEY_RESPONSES = "responses";
rhit.FB_KEY_TIME_POSTED = "timePosted";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_QUESTION_TITLE = "questionTitle";
rhit.singleSurveyManager = null;
rhit.surveysManager = null;
rhit.resultsManager = null;
rhit.fbAuthManager = null;
rhit.mainMenuController = null; 
rhit.makeSurvey = null; 

// From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

rhit.MainMenuController = class {
  constructor() {
    document.querySelector("#menuShowAllSurveys").onclick = (event) => {
      window.location.href = "/list.html";
    };

    document.querySelector("#menuShowMySurveys").onclick = (event) => {
      window.location.href = `/userSurveyPage.html?uid=${rhit.fbAuthManager.uid}`;
    };

    document.querySelector("#menuSignOut").onclick = (event) => {
      rhit.fbAuthManager.signOut();
    };

    document.querySelector("#makeSurveySubmit").onclick = (event) => { 

         

      rhit.makeSurvey.getData(); 
  
      document.querySelector("#makeAnswerSubmit").onclick = (event) => { 
  
        rhit.makeSurvey.getAnswers1(); 
  
       
          
         
          
        };
  
      
     
      
      };


    
    

    




    
    rhit.surveysManager.beginListening(this.updateList.bind(this));
  }

  _createCard(survey) {;
    let link = `/question.html?id${survey.id}`;
    if(survey.author = rhit.fbAuthManager.uid) {
      link = `resultsPage.html?id=${survey.id}`;
    }
    
    return htmlToElement(`<div
                  class="card row-hover pos-relative py-3 px-3 mb-3 border-warning border-top-0 border-right-0 border-bottom-0 rounded-0"
                >
                  <div class="row align-items-center">
                    <div class="col-md-8 mb-3 mb-sm-0">
                      <h5>
                        <a href="/question.html?id=${survey.id}" class="text-primary"
                          >${survey.name}</a
                        >
                      </h5>
                      <p class="text-sm">
                        <span class="op-6">Posted by</span>
                        <a class="text-black" href="#">${survey.author}</a>
                      </p>
                    </div>
                    <div class="col-md-4 op-7">
                      <div class="row text-right op-7">
                        <div class="col px-1">
                          <i class="ion-connection-bars icon-1x"></i>
                          <span class="d-block text-sm">${survey.responses.length} Responses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>`);
  }

  updateList() {
    // Make a new quoteListContainer
    const newList = htmlToElement('<div id="surveyColumn">');
    // Fill
    for (let i = 0; i < rhit.surveysManager.length; i++) {
      const survey = rhit.surveysManager.getSurveyAtIndex(i);
      const newCard = this._createCard(survey);

      // newCard.onclick = (event) => {
      //   // rhit.storage.setMovieQuoteId(mq.id);

      //   window.location.href = `/moviequote.html?id=${mq.id}`;
      // };

      newList.appendChild(newCard);
    }

    // Remove old
    const oldList = document.querySelector("#surveyColumn");
    oldList.removeAttribute("id");
    oldList.hidden = true;
    // Put in new
    oldList.parentElement.appendChild(newList);
  }
};

rhit.Question = class {
  constructor() {}
};

rhit.SurveyDisplayManager = class {
  constructor(questionNum) {
    this.questionNum = parseInt(questionNum);
    // document.querySelector("#menuSignOut").onclick = (event) => {
    //   rhit.fbAuthManager.signOut();
    // };
    document.querySelector("#nextButton").onclick = (event) => {
      var selected = document.querySelector('input[name="option"]:checked');
      rhit.singleSurveyManager.add(selected, questionNum);
      window.location.href = `/question.html?id=${
        rhit.singleSurveyManager.id
      }&num=${parseInt(questionNum) + 1}`;
    };
    document.querySelector("#previousButton").onclick = (event) => {
      window.location.href = `/question.html?id=${
        rhit.singleSurveyManager.id
      }&num=${questionNum - 1}`;
    };

    rhit.singleSurveyManager.beginListening(this.updateView.bind(this));
  }
  updateView() {
    document.querySelector("#surveyName").innerHTML =
      rhit.singleSurveyManager.name;
    document.querySelector("#questionTitle").innerHTML =
      rhit.singleSurveyManager.getQuestionAtIndex(
        this.questionNum
      ).questionTitle;
    document.querySelector("#questionIndex").innerHTML = `Question ${
      this.questionNum + 1
    } of ${rhit.singleSurveyManager.numQuestions}`;

    if (this.questionNum == 0) {
      document.querySelector("#previousButton").style.visibility = "hidden";
    }

    if (this.questionNum + 1 == rhit.singleSurveyManager.numQuestions) {
      document.querySelector(
        "#nextButton"
      ).innerHTML = `Submit&nbsp;<i class="material-icons">chevron_right</i>`;
    } else {
      document.querySelector(
        "#nextButton"
      ).innerHTML = `Next&nbsp;<i class="material-icons">chevron_right</i>`;
    }
    const question = rhit.singleSurveyManager.getQuestionAtIndex(
      this.questionNum
    );
    for (let i = 0; i < question.options.length; i++) {
      const optionsContainer = document.querySelector("#optionsContainer");
      optionsContainer.appendChild(htmlToElement(`<div class="form-check">
  <input class="form-check-input" type="radio" name="option" id="${question.options[i]}">
  <label class="form-check-label" for="${question.options[i]}">
    ${question.options[i]}
  </label>
</div>`));
    }
  }
};

rhit.SingleSurveyManager = class {
  constructor(id) {
    this.id = id;
    this._documentSnapshot = {};
    this._unsubscribe = null;
    this._ref = firebase
      .firestore()
      .collection(rhit.FB_COLLECTION_SURVEYS)
      .doc(id);
    this.response = [];
  }
  beginListening(changeListener) {
    this._unsubscribe = this._ref.onSnapshot((doc) => {
      if (doc.exists) {
        console.log("Document data:", doc.data());
        this._documentSnapshot = doc;
        changeListener();
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  }
  stopListening() {
    this._unsubscribe();
  }
  delete() {
    return this._ref.delete();
  }
  add(response, questionNum) {
    if (this.response[questionNum]) {
      this.response[questionNum] = response;
      console.log(response);
      return;
    }
    this.response.push(response)
    console.log(this.response);
  }
  getQuestionAtIndex(index) {
    const questions = this._documentSnapshot.get(rhit.FB_KEY_QUESTIONS);
    return questions[index];
  }
  // get id() {
  //   return this.id;
  // }
  get name() {
    return this._documentSnapshot.get(rhit.FB_KEY_NAME);
  }
  get author() {
    return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
  }
  get numQuestions() {
    return this._documentSnapshot.get(rhit.FB_KEY_QUESTIONS).length;
  }
};

// rhit.storage = rhit.storage || {};
// rhit.storage.MOVIEQUOTE_ID_KEY = "movieQuoteId";
// rhit.storage.getMovieQuoteId = function () {
//   const mqId = sessionStorage.getItem(rhit.storage.MOVIEQUOTE_ID_KEY);
//   if (!mqId) {
//     console.log("No movie quote id in sessionStorage");
//   }
//   return mqId;
// };
// rhit.storage.setMovieQuoteId = function (movieQuoteId) {
//   sessionStorage.setItem(rhit.storage.MOVIEQUOTE_ID_KEY, movieQuoteId);
// };

rhit.Survey = class {
  constructor(id, name, author, responses) {
    this.id = id;
    this.name = name;
    this.author = author;
    this.responses = responses;
  }
};


rhit.MakeSurvey = class { 

  constructor() {

    document.querySelector("#makeSurveySubmit").onclick = (event) => { 

         

      rhit.makeSurvey.getData(); 
  
      document.querySelector("#makeAnswerSubmit").onclick = (event) => { 
  
        rhit.makeSurvey.getAnswers1(); 
  
       
          
         
          
        };
  
      
     
      
      };

    this.numQuestions = 0; 

    this.answersNumOrder = []; 

    



   
    
    



  }

  getData(){ 
    
    let num = document.getElementById('nummQuestions').value;
    

    this.numQuestions = num; 

       var target = document.getElementById('finishSurvey'); 
   
       target.innerHTML = '<br> <br> <br>';   



       for(let  i = 0; i < num; i++){ 

      target.innerHTML += '<div class="form-outline"> <label class="form-label" for="formControlLg" style="margin-left: 15px;" id="numQuestions">Question '+(i+1)+'</label></div> <div class="form-control"> <label for="role" id="label-role" style="margin-left: 15px;" > How many Answers? </label> <!-- Dropdown options --> <select id="numAnswers'+i+'" name="role" style="margin-left: 15px;" >  <option value= 1 >1</option> <option value=2>2</option> <option value=3>3</option> <option value=4>4</option> </select> </div> <div id= spaceForAnswers'+i+' >  </div> '; 
      
       
    
    
    }

    target.innerHTML += '<button id="makeAnswerSubmit"  type="button" class="btn btn-primary"> Submit number of Answers </button>'

    

    
  }
  
  getAnswers1(){

  var target = document.getElementById('finishSurvey'); 

 

  for(let i = 0; i < this.numQuestions; i++ ) {


    this.answersNumOrder.push( document.getElementById('numAnswers'+i+'').value)



  }

  for(let j = 0; j <this.answersNumOrder.length; j++){

    console.log(this.answersNumOrder[j])

  }
  


  for(let i = 0; i < this.numQuestions; i++ ) {

   
   
     
  
  if(i < 1) { 

      

      target.innerHTML = '<br> <br> <br>'; 

    }

    
    target.innerHTML += '  <div class="form-outline mb-4">  <input type="text" id="form4Example1" class="form-control" /> <label class="form-label" for="form4Example1">Question '+(i+1)+'</label></div>'

    for(let k = 0; k < this.answersNumOrder[i]; k++){ 

      target.innerHTML += '<input type="text" id="Q'+i+'" placeholder="Enter Answer '+(k+1)+'"> <br> <br> '


    }

  

 

    

 }

} 

} 

rhit.ResultsController = class {
  constructor() {
    rhit.singleSurveyManager.beginListening(this.updateView.bind(this));
  }
  updateView() {
    const questionResults = rhit.singleSurveyManager.results; //Insert Question.data in an array
   
    this.chart = anychart.pie();
    this.chart.title(rhit.singleSurveyManager.getQuestionAtIndex(0).questionTitle); //Need to make it insert the different questions not just 0
    
    this.chart.data(questionResults[0]);
    this.chart.container("resultsPage");
    this.chart.radius("40%");
    this.chart.draw();
    this.chart.legend().position("right");
    this.chart.legend().itemsLayout("vertical");
    
  }
  _createResults() {
    return htmlToElement();
  }
};

rhit.SurveysManager = class {
  constructor(uid) {
    this._uid = uid;
    this._documentSnapshots = [];
    this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_SURVEYS);
    this._unsubscribe = null;
  }
  add(name, author, questions) {
    // add quote
  }
  beginListening(changeListener) {
    let query = this._ref.orderBy(rhit.FB_KEY_TIME_POSTED, "desc").limit(50);

    if (this._uid) {
      query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
    }

    this._unsubscribe = query.onSnapshot((querySnapshot) => {
      // querySnapshot.forEach((doc) => {
      //     console.log(doc.data());
      // });

      this._documentSnapshots = querySnapshot.docs;
      changeListener();
    });
  }
  stopListening() {
    this._unsubscribe();
  }
  //  update(id, quote, movie) {    }
  //  delete(id) { }
  get length() {
    return this._documentSnapshots.length;
  }
  getSurveyAtIndex(index) {
    const docSnapshot = this._documentSnapshots[index];
    const survey = new rhit.Survey(
      docSnapshot.id,
      docSnapshot.get(rhit.FB_KEY_NAME),
      docSnapshot.get(rhit.FB_KEY_AUTHOR),
      docSnapshot.get(rhit.FB_KEY_RESPONSES)
    );
    return survey;
  }
};

rhit.LoginController = class {
  constructor() {
    document.querySelector("#rosefireButton").onclick = (event) => {
      rhit.fbAuthManager.signIn();
    };
  }
};

rhit.FbAuthManager = class {
  constructor() {
    this._user = null;
  }
  beginListening(changeListener) {
    firebase.auth().onAuthStateChanged((user) => {
      this._user = user;
      changeListener();
    });
  }
  signIn() {
    Rosefire.signIn("cde06e0a-db30-4dab-845a-a63409f9d16b", (err, rfUser) => {
      if (err) {
        console.log("Rosefire error!", err);
        return;
      }
      console.log("Rosefire success!", rfUser);

      // Next use the Rosefire token with Firebase auth.
      firebase
        .auth()
        .signInWithCustomToken(rfUser.token)
        .catch((error) => {
          if (error.code === "auth/invalid-custom-token") {
            console.log("The token you provided is not valid.");
          } else {
            console.log("signInWithCustomToken error", error.message);
          }
        }); // Note: Success should be handled by an onAuthStateChanged listener.
    });
  }
  signOut() {
    firebase.auth().signOut();
  }
  get uid() {
    return this._user.uid;
  }
  get isSignedIn() {
    return !!this._user;
  }
};

rhit.checkForRedirects = function () {
  if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
    window.location.href = "/list.html";
  }

  if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
    window.location.href = "/";
  }
};

rhit.initializePage = function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (document.querySelector("#listPage")) {
    const uid = urlParams.get("uid");
    rhit.surveysManager = new rhit.SurveysManager(uid);
    new rhit.MainMenuController();
  }

  // if (document.querySelector("#detailPage")) {
  //   // const movieQuoteId = rhit.storage.getMovieQuoteId();
  //   // console.log(`Detail page for ${movieQuoteId}`);

  //   const movieQuoteId = urlParams.get("id");

  //   if (!movieQuoteId) {
  //     window.location.href = "/";
  //   }

  //   rhit.fbSingleQuoteManager = new rhit.FbSingleQuoteManager(movieQuoteId);
  //   new rhit.DetailPageController();
  // }

  if (document.querySelector("#loginPage")) {
    new rhit.LoginController();
  }


  if (document.querySelector("#questionPage")) {
    const id = urlParams.get("id");
    let questionNum = urlParams.get("num");

    if (!id) {
      window.location.href = "/";
    }

    if (!questionNum) {
      questionNum = 0;
    }

    rhit.singleSurveyManager = new rhit.SingleSurveyManager(id);
    new rhit.SurveyDisplayManager(questionNum);
  }
};

/* Main */
/** function and class syntax examples */
rhit.main = function () {
  console.log("Ready");
  
  rhit.fbAuthManager = new rhit.FbAuthManager();
  // rhit.mainMenuController = new rhit.MainMenuController(); 
  rhit.fbAuthManager.beginListening(() => {
    console.log("auth change callcback fired.");

    rhit.checkForRedirects();
    rhit.initializePage();
  });
};

rhit.main();
