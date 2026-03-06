/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};


/** globals */
rhit.FB_COLLECTION_SCHEDULEPLANNER = "SchedulePlanner";
rhit.FB_KEY_UID = "uid";
rhit.FB_KEY_SCHEDULENAME = "Schedule Name";
rhit.FB_KEY_CLASSNAME = "ClassName";
rhit.FB_KEY_CRNS = "CRNS";
rhit.FB_KEY_LASTTOUCHED = "lastTouched";
rhit.FB_KEY_QUARTER = "Quarter"
rhit.fbSchedulesManager = null;
rhit.fbSingleScheduleManager = null;
rhit.fbScheduleBuilderManager = null;
rhit.fbAuthManager = null;
rhit.fallClasses = null;
rhit.springClasses = null;
rhit.summerClasses = null;
rhit.springKey = "Spring '23"
rhit.summerKey = "Summer '23"
rhit.fallKey = "Fall '23";
rhit.isFallFiltered = false;
rhit.isSpringFiltered = false;
rhit.isSummerFiltered = false;

//some backend variables for class searches
let searchCourse = false;
let searchProf = false;
let searchDepartment = false;
let classesSearchedFor = [];

// From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.ListPageController = class {
	constructor() {
		document.querySelector("#fallCheckbox").addEventListener("click", (event) => {
			rhit.isFallFiltered = !rhit.isFallFiltered
		})

		document.querySelector("#springCheckbox").addEventListener("click", (event) => {
			rhit.isSpringFiltered = !rhit.isSpringFiltered
		})

		document.querySelector("#summerCheckbox").addEventListener("click", (event) => {
			rhit.isSummerFiltered = !rhit.isSummerFiltered
		})

		document.querySelector("#submitFilterSchedule").addEventListener("click", (event) => {

			rhit.isFallFiltered = !$('#fallCheckbox').prop('checked');
			rhit.isSpringFiltered = !$('#springCheckbox').prop('checked');
			rhit.isSummerFiltered = !$('#summerCheckbox').prop('checked');
			
			this.updateList();
		})

		document.querySelector("#menuShowSchedules").addEventListener("click", (event) => {
			window.location.href = "/schedules.html";
		});

		document.querySelector("#menuShowScheduleBuilder").addEventListener("click", (event) => {
			window.location.href = "/scheduleBuilder.html";
		});

		document.querySelector("#showClassSearch").addEventListener("click", (event) => {
			window.location.href = "/classLookup.html";
		});

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		document.querySelector("#submitAddSchedule").addEventListener("click", (event) => {
			const crns = [];
			const scheduleName = document.querySelector("#inputSchedName").value;
			const quarter = document.querySelector("#quarterDropdown").innerHTML;
			crns.push(document.querySelector("#inputCrnOne").value);
			crns.push(document.querySelector("#inputCrnTwo").value);
			crns.push(document.querySelector("#inputCrnThree").value);
			crns.push(document.querySelector("#inputCrnFour").value);
			crns.push(document.querySelector("#inputCrnFive").value);
			crns.push(document.querySelector("#inputCrnSix").value);
			crns.push(document.querySelector("#inputCrnSeven").value);
			crns.push(document.querySelector("#inputCrnEight").value);
			rhit.fbSchedulesManager.add(crns, scheduleName, quarter);
		});

		document.querySelector("#springBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.springKey
		})

		document.querySelector("#fallBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.fallKey
		})

		document.querySelector("#summerBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.summerKey
		})


		$("#addScheduleDialog").on("show.bs.modal", (event) => {
			// Pre animation	
			document.querySelector("#quarterDropdown").innerHTML = rhit.springKey
			document.querySelector("#inputCrnOne").value = "";
			document.querySelector("#inputCrnTwo").value = "";
			document.querySelector("#inputCrnThree").value = "";
			document.querySelector("#inputCrnFour").value = "";
			document.querySelector("#inputCrnFive").value = "";
			document.querySelector("#inputCrnSix").value = "";
			document.querySelector("#inputCrnSeven").value = "";
			document.querySelector("#inputCrnEight").value = "";
			document.querySelector("#inputSchedName").value = "";
		});
		$("#addScheduleDialog").on("shown.bs.modal", (event) => {
			// Post animation
			document.querySelector("#inputSchedName").focus();
		});

		// Start listening!
		rhit.fbSchedulesManager.beginListening(this.updateList.bind(this));
	}

	updateList() {
		console.log("I need to update the list on the page!");
		console.log(`Num schedules = ${rhit.fbSchedulesManager.length}`);
		console.log("Example schedules = ", rhit.fbSchedulesManager.getScheduleAtIndex(0));

		// Make a new scheduleListContainer
		const newList = htmlToElement('<div id="scheduleListContainer"></div>');
		// Fill the scheduleListContainer with schedule cards using a loop
		for (let i = 0; i < rhit.fbSchedulesManager.length; i++) {
			const mq = rhit.fbSchedulesManager.getScheduleAtIndex(i);
			if (!rhit.isFallFiltered || !(mq.quarter == rhit.fallKey)) {
				if (!rhit.isSpringFiltered || !(mq.quarter == rhit.springKey)) {
					if (!rhit.isSummerFiltered || !(mq.quarter == rhit.summerKey)) {
						const newCard = this._createCard(mq);
						newCard.onclick = (event) => {
							//console.log(`You clicked on ${mq.id}`);
							window.location.href = `/singleSchedule.html?id=${mq.id}`;
						};
						newList.appendChild(newCard);
					}
				}

			}
		}

		// Remove the old scheduleListContainer
		const oldList = document.querySelector("#scheduleListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		// Put in the new scheduleListContainer
		oldList.parentElement.appendChild(newList);
	}

	_createCard(schedule) {
		let string;
		let stringStart = `<div class="card">
		<div class="card-body">
			<h5 class="card-title">${schedule.name}</h5>`

		if (schedule.crns.length == 0) {
			stringStart = stringStart + `<h6 class="card-subtitle mb-2 text-muted">No Classes</h6>`;
		} else {
			for (let i = 0; i < schedule.classes.length; i++) {
				if (schedule.classes[i] == null) {
					stringStart = stringStart + `<h6 class="card-subtitle mb-2 text-muted">CRN: ${schedule.crns[i]} - No Class Was Found With This CRN</h6>`
				} else {
					stringStart = stringStart + `<h6 class="card-subtitle mb-2 text-muted">CRN: ${schedule.crns[i]} - Class: ${schedule.classes[i].Name}</h6>`
				}
			}
		}
		
		let stringEnd = `</div>
		</div>`

		string = stringStart + stringEnd;
		return htmlToElement(string);
	}
}

rhit.DetailPageController = class {
	constructor() {
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitEditSchedule").addEventListener("click", (event) => {
			const crns = [];
			const name = document.querySelector("#inputSchedName").value;
			const quarter = document.querySelector("#quarterDropdown").innerHTML;
			crns.push(document.querySelector("#inputCrn1").value);
			crns.push(document.querySelector("#inputCrn2").value);
			crns.push(document.querySelector("#inputCrn3").value);
			crns.push(document.querySelector("#inputCrn4").value);
			crns.push(document.querySelector("#inputCrn5").value);
			crns.push(document.querySelector("#inputCrn6").value);
			crns.push(document.querySelector("#inputCrn7").value);
			crns.push(document.querySelector("#inputCrn8").value);
			rhit.fbSingleScheduleManager.update(crns, name, quarter);
		});

		document.querySelector("#springBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.springKey
		})

		document.querySelector("#fallBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.fallKey
		})

		document.querySelector("#summerBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.summerKey
		})

		$("#editScheduleDialog").on("show.bs.modal", (event) => {
			// Pre animation
			const crns = rhit.fbSingleScheduleManager.crns;
			for (let i = 0; i < 8; i++) {
				if (crns[i]) {
					document.querySelector(`#inputCrn${i + 1}`).value = crns[i];
				} else {
					document.querySelector(`#inputCrn${i + 1}`).value = "";
				}
			}
			const quarter = rhit.fbSingleScheduleManager.quarter;
			document.querySelector("#quarterDropdown").innerHTML = quarter;
			document.querySelector("#inputSchedName").value = rhit.fbSingleScheduleManager.name;
		});
		$("#editScheduleDialog").on("shown.bs.modal", (event) => {
			// Post animation
			document.querySelector("#inputSchedName").focus();
		});

		document.querySelector("#submitDeleteSchedule").addEventListener("click", (event) => {
			rhit.fbSingleScheduleManager.delete().then(function () {
				console.log("Document successfully deleted!");
				window.location.href = "/schedules.html";
			}).catch(function (error) {
				console.error("Error removing document: ", error);
			});
		});

		rhit.fbSingleScheduleManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		const schedule = rhit.fbSingleScheduleManager.schedule;
		const newCard = this._createCard(schedule);

		const oldCard = document.querySelector("#cardContainer");
		oldCard.parentElement.prepend(newCard);
		oldCard.remove()

		this._clearTable();
		for (let i = 0; i < schedule.classes.length; i++) {
			if (!(schedule.classes[i] == null)) {
				console.log(schedule.classes[i]);
				let time = schedule.classes[i].Time
				if (time.includes(';')) {
					let timeArr = time.split("; ")
					for (let j = 0; j < timeArr.length; j++) {
						if (timeArr[j].includes('-')) {
							let timeArr2 = timeArr[j].split('-')
							this._createTable(timeArr2[0] + "/", schedule.classes[i].CID, timeArr2[1].substring(0,timeArr2[1].indexOf(':')))
						} else {
							this._createTable(timeArr[j], schedule.classes[i].CID, null)
						}
					}
				} else {
					if (time.includes('-')) {
						let timeArr = time.split('-');
						this._createTable(timeArr[0] + "/", schedule.classes[i].CID, timeArr[1].substring(0,timeArr[1].indexOf(':')))
					} else {
						this._createTable(time, schedule.classes[i].CID, null)
					}
				}
			}
		}

		document.querySelector("#menuEdit").style.display = "flex";
		document.querySelector("#menuDelete").style.display = "flex";
	}

	_createTable(time, cid, finTime) {
		if (time != "" && time != "TBA" && time != "TBA/TBA/ONLINE") {
			let days = time.substring(0,time.indexOf('/'))
			let temp = time.substring(time.indexOf('/') + 1)
			console.log(temp)
			let hour = temp.substring(0, temp.indexOf('/'))
			hour = hour.substring(0,hour.indexOf(":"));
			let dayArr = days.split("");
			for (let j = 0; j < dayArr.length; j++) {
				let currVal = document.querySelector(`#${dayArr[j].toLowerCase()}${hour}`).innerHTML
				if (finTime != null) {
					let currHour = parseInt(hour);
					console.log(currHour);
					console.log(parseInt(finTime))
					while (currHour != parseInt(finTime)) {
						if (currHour == 12) {
							currHour = 1;
						} else {
							currHour = currHour + 1; 
						}
						
						if (currVal != "") {
							document.querySelector(`#${dayArr[j].toLowerCase()}${currHour}`).innerHTML = currVal + "\n" + cid
						} else {
							document.querySelector(`#${dayArr[j].toLowerCase()}${currHour}`).innerHTML = cid;
						}
					}
				}
				if (currVal != "") {
					document.querySelector(`#${dayArr[j].toLowerCase()}${hour}`).innerHTML = currVal + "\n" + cid
				} else {
					document.querySelector(`#${dayArr[j].toLowerCase()}${hour}`).innerHTML = cid;
				}
			}
		}
	}

	_clearTable() {
		let days = ["m","t","w","r","f"];
		let hours = [8,9,10,11,12,1,2,3,4]
		for (let i = 0; i < days.length; i++) {
			for (let j = 0; j < hours.length; j++) {
				document.querySelector(`#${days[i]}${hours[j]}`).innerHTML = "";
			}
		}
	}

	_createCard(schedule) {
		let string;
		let stringStart = `<div class="card" id="cardContainer">
		<div class="card-body">
			<h5 class="card-title">${schedule.name}</h5>`

		if (schedule.crns.length == 0) {
			stringStart = stringStart + `<h6 class="card-subtitle mb-2 text-muted">No Classes</h6>`;
		} else {
			for (let i = 0; i < schedule.classes.length; i++) {
				if (schedule.classes[i] == null) {
					stringStart = stringStart + `<h6 class="card-subtitle mb-2 text-muted">CRN: ${schedule.crns[i]} - No Class Was Found With This CRN</h6>`
				} else {
					stringStart = stringStart + `<h6 class="card-subtitle mb-2 text-muted">CRN: ${schedule.crns[i]} - Class: ${schedule.classes[i].Name}</h6>`
				}
			}
		}
		
		let stringEnd = `</div>
		</div>`

		string = stringStart + stringEnd;
		return htmlToElement(string);
	}
}

rhit.BuilderPageController = class {
	constructor() {
		document.querySelector("#menuShowSchedules").addEventListener("click", (event) => {
			window.location.href = "/schedules.html";
		});

		document.querySelector("#menuShowScheduleBuilder").addEventListener("click", (event) => {
			window.location.href = "/scheduleBuilder.html";
		});

		document.querySelector("#showClassSearch").addEventListener("click", (event) => {
			window.location.href = "/classLookup.html";
		});

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		document.querySelector("#buildSchedulesBtn").addEventListener("click", (event) => {
			const cids = [];
			const quarter = document.querySelector("#quarterDropdown").innerHTML;
			cids.push(document.querySelector("#cidInput1").value);
			cids.push(document.querySelector("#cidInput2").value);
			cids.push(document.querySelector("#cidInput3").value);
			cids.push(document.querySelector("#cidInput4").value);
			cids.push(document.querySelector("#cidInput5").value);
			cids.push(document.querySelector("#cidInput6").value);
			cids.push(document.querySelector("#cidInput7").value);
			cids.push(document.querySelector("#cidInput18").value);
			this._clearTable(cids, quarter)
		});

		document.querySelector("#springBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.springKey
		})

		document.querySelector("#fallBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.fallKey
		})

		document.querySelector("#summerBtn").addEventListener("click", (event) => {
			document.querySelector("#quarterDropdown").innerHTML = rhit.summerKey
		})
	}

	_constructSchedules(cids, quarter) {
		let oneCidList = [];
		let multCidList = [];
		for (let i = 0; i < cids.length; i++) {
			if (cids[i].includes('-')) {
				const temp = rhit.findClassFromCid(cids[i], quarter)
				if (temp == null) {
					return null;
				}
				oneCidList.push(temp);
			} else {
				multCidList.push(rhit.findClassesFromCid(cids[i], quarter))
			}	
		}
		if (multCidList.length + oneCidList.length != cids.length) {
			return null;
		}

		for (let i = 0; i < oneCidList.length; i++) {
			let time = oneCidList[i].Time;
			if (time.includes(';')) {
				let timeArr = time.split("; ")
				for (let j = 0; j < timeArr.length; j++) {
					if (timeArr[j].includes('-')) {
						let timeArr2 = timeArr[j].split('-')
					} else {
					}
				}
			} else {
				if (time.includes('-')) {
					let timeArr = time.split('-');
				} else {
				}
			}
		}

	}
}

rhit.findClassesFromCid = function(cid, quarter) {
	let classes;
	if (quarter == rhit.fallKey) {
		classes = rhit.fallClasses;
	}
	if (quarter == rhit.summerKey) {
		classes = rhit.summerClasses;
	}
	if (quarter == rhit.springKey) {
		classes = rhit.springClasses
	}
	let output = [];
	for (let i = 0; i < classes.length; i++) {
		if (classes[i].CID.includes(cid)) {
			output.push(classes[i]);
		}
	}
	return output;
}

rhit.findClassFromCid = function(cid, quarter) {
	let classes;
	if (quarter == rhit.fallKey) {
		classes = rhit.fallClasses;
	}
	if (quarter == rhit.summerKey) {
		classes = rhit.summerClasses;
	}
	if (quarter == rhit.springKey) {
		classes = rhit.springClasses
	}
	for (let i = 0; i < classes.length; i++) {
		if (cid == classes[i].CID) {
			return classes[i];
		}
	}
	return null;
}

rhit.findClassFromCrn = function(crn, quarter) {
	let classes;
	if (quarter == rhit.fallKey) {
		classes = rhit.fallClasses;
	}
	if (quarter == rhit.summerKey) {
		classes = rhit.summerClasses;
	}
	if (quarter == rhit.springKey) {
		classes = rhit.springClasses
	}
	for (let i = 0; i < classes.length; i++) {
		if (crn == classes[i].CRN) {
			return classes[i];
		}
	}
	return null;
}

rhit.LookupPageController = class {
	constructor() {

		// Menu listeners
		document.querySelector("#menuShowSchedules").addEventListener("click", (event) => {
			var table = document.getElementById("lookupTable");
    		table.style.display = "none";
			window.location.href = "/schedules.html";
		});

		document.querySelector("#menuShowScheduleBuilder").addEventListener("click", (event) => {
			var table = document.getElementById("lookupTable");
    		table.style.display = "none";
			window.location.href = "/scheduleBuilder.html";
		});

		document.querySelector("#showClassSearch").addEventListener("click", (event) => {
			var table = document.getElementById("lookupTable");
    		table.style.display = "none";
			window.location.href = "/classLookup.html";
		});

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			var table = document.getElementById("lookupTable");
    		table.style.display = "none";
			rhit.fbAuthManager.signOut();
		});

		//Dropdown term selector listeners
		document.querySelector("#selectFall").addEventListener("click", (event) => {
			document.getElementById("dropdownButton").innerHTML = "Fall 23";
		});

		document.querySelector("#selectSummer").addEventListener("click", (event) => {
			document.getElementById("dropdownButton").innerHTML = "Summer 23";
		});

		document.querySelector("#selectSpring").addEventListener("click", (event) => {
			document.getElementById("dropdownButton").innerHTML = "Spring 23";
		});

		//search bar clicks (decides which parameters to search from)
		document.querySelector("#inputCourse").addEventListener("click", (event) => {
			searchCourse = true;
			searchProf = false;
			searchDepartment = false;
		});

		document.querySelector("#inputProfessor").addEventListener("click", (event) => {
			searchCourse = false;
			searchProf = true;
			searchDepartment = false;
		});

		document.querySelector("#inputDepartment").addEventListener("click", (event) => {
			searchCourse = false;
			searchProf = false;
			searchDepartment = true;
		});

		//lookup
		document.querySelector("#lookupButton").addEventListener("click", (event) => {
			console.log("Look Up");
			var table = document.getElementById("lookupTable");
    		table.style.display = "table";
			this.clearTable();
			this.checkParameters.bind(this)();
		});
	}

	//evaluates which parameters to search through
	//then chooses a search method accordingly
	checkParameters() {
		let term = document.getElementById("dropdownButton").innerHTML;
		console.log(term);
		if (term == "Fall 23") {
			if (searchCourse) {
				let input = document.querySelector("#inputCourse").value;
				this.searchByCourse(rhit.fallClasses, input);
			}
			else if (searchProf) {
				let input = document.querySelector("#inputProfessor").value;
				this.searchByProf(rhit.fallClasses, input);
			}
			else if (searchDepartment) {
				let input = document.querySelector("#inputDepartment").value;
				this.searchByDepartment(rhit.fallClasses, input);
			}
		}
		else if (term == "Summer 23") {
			if (searchCourse) {
				let input = document.querySelector("#inputCourse").value;
				this.searchByCourse(rhit.summerClasses, input);
			}
			else if (searchProf) {
				let input = document.querySelector("#inputProfessor").value;
				this.searchByProf(rhit.summerClasses, input);
			}
			else if (searchDepartment) {
				let input = document.querySelector("#inputDepartment").value;
				this.searchByDepartment(rhit.summerClasses, input);
			}
		}
		else if (term == "Spring 23") {
			if (searchCourse) {
				let input = document.querySelector("#inputCourse").value;
				this.searchByCourse(rhit.springClasses, input);
			}
			else if (searchProf) {
				let input = document.querySelector("#inputProfessor").value;
				this.searchByProf(rhit.springClasses, input);
			}
			else if (searchDepartment) {
				let input = document.querySelector("#inputDepartment").value;
				this.searchByDepartment(rhit.springClasses, input);
			}
		}
		else {
			console.log("No term Selected");
		}
	};

	//These search methods take the selected term classes and the input to search with
	// then filter the classes
	searchByCourse(classes, input) {
		console.log("searchByCourse");
		for (const course of classes) {
			if (course.CID.includes(input)) {
				this.addEntryToTable(course);
				console.log(course);
			}
		}
	}

	searchByProf(classes, input) {
		console.log("searchByProf");
		for (const course of classes) {
			if (course.Prof.includes(input)) {
				this.addEntryToTable(course);
				console.log(course);
			}
		}
	}

	searchByDepartment(classes, input) {
		console.log("searchByDepartment");
		for (const course of classes) {
			if (input == "NA") {
				console.log("No department selected");
			}
			else if (input == "BBE") {
				if (course.CID.includes("BE")) {
					this.addEntryToTable(course);
					console.log(course);
				}
				else if (course.CID.includes("BIO")) {
					this.addEntryToTable(course);
					console.log(course);
				}
				else if (course.CID.includes("MDS")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "CHE") {
				if (course.CID.includes("CHE")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "CHEM") {
				if (course.CID.includes("CHEM")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "CE") {
				if (course.CID.includes("CE")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "CSSE") {
				if (course.CID.includes("CSSE")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "ECE") {
				if (course.CID.includes("ECE")) {
					this.addEntryToTable(course);
					console.log(course);
				}
				else if (course.CID.includes("ES") && !course.CID.includes("ES205")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "ENGD") {
				if (course.CID.includes("ENGD")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "EMGT") {
				if (course.CID.includes("EMGT")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "MA") {
				if (course.CID.includes("MA")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "ME") {
				if (course.CID.includes("ME")) {
					this.addEntryToTable(course);
					console.log(course);
				}
				else if (course.CID.includes("EM")) {
					this.addEntryToTable(course);
					console.log(course);
				}
				else if (course.CID.includes("ES205")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			else if (input == "PH") {
				if (course.CID.includes("PH")) {
					this.addEntryToTable(course);
					console.log(course);
				}
				if (course.CID.includes("OE")) {
					this.addEntryToTable(course);
					console.log(course);
				}
				if (course.CID.includes("EP")) {
					this.addEntryToTable(course);
					console.log(course);
				}
			}
			//Handles HSSA Classes
			else {
				this.addEntryToTable(course);
				console.log(course);
			}
		}
	}

	addEntryToTable(course) {
		var table = document.getElementById("lookupTable").getElementsByTagName("tbody")[0];
		var row = table.insertRow();
	  
		var nameCell = row.insertCell(0);
		var courseIdCell = row.insertCell(1);
		var crnCell = row.insertCell(2);
		var professorCell = row.insertCell(3);
		var timeCell = row.insertCell(4);
		var creditHoursCell = row.insertCell(5);
	  
		nameCell.innerHTML = course.Name;
		courseIdCell.innerHTML = course.CID;
		crnCell.innerHTML = course.CRN;
		professorCell.innerHTML = course.Prof;
		timeCell.innerHTML = course.Time;
		creditHoursCell.innerHTML = course.Hours;
	}

	clearTable() {
		var table = document.getElementById("lookupTable");
		var tbody = table.getElementsByTagName("tbody")[0];
	  
		while (tbody.firstChild) {
		  tbody.removeChild(tbody.firstChild);
		}
	}

}

rhit.Schedule = class {
	constructor(id, name, crns, quarter) {
		this.id = id;
		this.name = name;
		this.crns = crns;
		this.quarter = quarter;
		this.classes = [];
		for (let i = 0; i < this.crns.length; i++) {
			this.classes.push(rhit.findClassFromCrn(crns[i], quarter));
		}
	}
}

rhit.FbSchedulesManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_SCHEDULEPLANNER);
		this._unsubscribe = null;
	}

	add(crns, name, quarter) {
		// Add a new document with a generated id.
		crns = crns.filter(Boolean);
		let query = this._ref;

		query.add({
			[rhit.FB_KEY_CRNS]: crns,
			[rhit.FB_KEY_SCHEDULENAME]: name,
			[rhit.FB_KEY_UID]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LASTTOUCHED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_QUARTER]: quarter
		})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}

	beginListening(changeListener) {

		let query = this._ref;
		query = query.orderBy(rhit.FB_KEY_LASTTOUCHED, "desc").limit(50);
		query = query.where(rhit.FB_KEY_UID, "==", this._uid);

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			querySnapshot.forEach((doc) => {
				console.log(doc.data());
			});
			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getScheduleAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.Schedule(docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_SCHEDULENAME),
			docSnapshot.get(rhit.FB_KEY_CRNS),
			docSnapshot.get(rhit.FB_KEY_QUARTER),);
		return mq;
	}
}

rhit.FbSingleScheduleManager = class {
	constructor(scheduleId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_SCHEDULEPLANNER).doc(scheduleId);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	update(crns, name, quarter) {
		crns = crns.filter(Boolean);
		this._ref.update({
			[rhit.FB_KEY_SCHEDULENAME]: name,
			[rhit.FB_KEY_CRNS]: crns,
			[rhit.FB_KEY_LASTTOUCHED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_QUARTER]: quarter
		})
			.then(() => {
				console.log("Document successfully updated!");
			})
			.catch(function (error) {
				// The document probably doesn't exist.
				console.error("Error updating document: ", error);
			});
	}

	delete() {
		return this._ref.delete();
	}

	get name() {
		return this._documentSnapshot.get(rhit.FB_KEY_SCHEDULENAME);
	}

	get crns() {
		return this._documentSnapshot.get(rhit.FB_KEY_CRNS);
	}

	get uid() {
		return this._documentSnapshot.get(rhit.FB_KEY_UID);
	}

	get schedule() {
		return new rhit.Schedule(this._documentSnapshot.id, this.name, this.crns, this.quarter);
	}

	get quarter() {
		return this._documentSnapshot.get(rhit.FB_KEY_QUARTER);

	}
}

rhit.fbScheduleBuilderManager = class {
	constructor() {

	}
}

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
		console.log("Sign in using Rosefire");
		Rosefire.signIn("94788987-3d35-4e54-8d4e-c6b5164f0011", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});
		});

	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		return this._user.uid;
	}
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/schedules.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
};

rhit.loadSpringData = async function() {
	return axios.get('../data/springClasses.json')
		.then((res) => {
			rhit.springClasses = res.data;
		})
		.catch((err) => {
			console.log("Error fetching spring classes", err);
		});
};

rhit.loadSummerData = async function() {
	return axios.get('../data/summerClasses.json')
		.then((res) => {
			rhit.summerClasses = res.data;
		})
		.catch((err) => {
			console.log("Error fetching summer classes", err);
		});
};

rhit.loadFallData = async function() {
	return axios.get('../data/fallClasses.json')
		.then((res) => {
			rhit.fallClasses = res.data;
		})
		.catch((err) => {
			console.log("Error fetching fall classes", err);
		});
};

rhit.initializePage = async function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (!(rhit.fallClasses)) {
		await rhit.loadFallData();
	}
	if (!(rhit.springClasses)) {
		await rhit.loadSpringData()
	}
	if (!(rhit.summerClasses)) {
		await rhit.loadSummerData()
	}

	if (document.querySelector("#listPage")) {
		console.log("You are on the list page.");
		const uid = rhit.fbAuthManager.uid;
		rhit.fbSchedulesManager = new rhit.FbSchedulesManager(uid);
		new rhit.ListPageController();
	}
	if (document.querySelector("#detailPage")) {
		console.log("You are on the detail page.");
		const scheduleId = urlParams.get("id");
		if (!scheduleId) {
			window.location.href = "/";
		}
		rhit.fbSingleScheduleManager = new rhit.FbSingleScheduleManager(scheduleId);
		new rhit.DetailPageController();
	}
	if (document.querySelector("#scheduleBuilderPage")) {
		console.log("You are on the schedule builder page.");
		new rhit.BuilderPageController();
	}
	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page.");
		new rhit.LoginPageController();
	}
	if (document.querySelector("#lookupPage")) {
		console.log("You are on the lookup page.");
		new rhit.LookupPageController();
	}
};

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

rhit.main();
