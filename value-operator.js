
"use strict";

/*

* Operator call-array item format

	format a:
		function	=>	my_operator( v ) { ... }, a user-defined operator function, that return success (transfered value), or return fail ( `undefined` or an Error object ).
			my_operator(v)

	format b:
		"string"	=>	"operator_name"
			operatorSet["operator_name"]( v )
		
		":string"	=>	a user-defined label, does nothing; characters set of the `string` part is [a-zA-Z0-9_].
		
	format c:
		[ "operator_name" / my_operator, [ arg1, ... ]/arg1 ]	=>	operator with arguments
			operatorSet["operator_name"]( v, arg1, ... ), or
			my_operator( v, arg1, ... )

	format d:
		[ this_object, "operator_name" / my_operator, [ arg1, ... ]/arg1 [, normalized_flag(===1)] ]		=>	operator with this_object and arguments
			this_object["operator_name"]( v, arg1, ... ), or
			my_operator.apply( this_object, [ v, arg1, ... ] )
		
		Note: the format c and d will be modified internally to a normalized format d, with normalized_flag===1.
		
	format e:
		regExp		=>	myRegExp,	a user-defined regExp object.
			defaultOperatorSet["match"]( v, myRegExp )

* Jump-command

	A jump-command is defined as a string started with ":", and appended to a call-array item's name, ex. "toInteger:myCommand".
	
	Command format
		
		":" + [<condition>] + [<direction>] + <label>
		
		<condition>
			empty
						when call-array item success, jump to the label;
						when fail, process the next with previous success value;
						
			"!"
						when success, process the next;
						when fail, jump to the label with previous success value;
		
		<direction>
			empty		search the label forward then backward
			"+"			search the label forward
			"-"			search the label backward
		
		<label>
			"<label>"	a user-defined label
			
			"last"		last item of call-array, label "last" can be overrided by user;
			"first"		first item of call-array, label "first" can be overrided by user;
			
			"$"			do not jump, but return the jumping value, or continue processing the next, refer <condition>;
			
			"$$"		stop the process, return current success or fail value;
			"$$-"		stop the process, return current success value, or previous success value if current value is fail;
*/

/////////////////////////////////////////////////
// default operator set

// NOTE for debug: object `defaultOperatorSet` has a methed `toString()`, so `""+defaultOperatorSet` will return string "undefined".

var defaultOperatorSet = {

	/********************** constant ***********************/

	"now": function () { return new Date(); },
	"nowTime": function () { return (new Date()).getTime(); },
	"utcNow": function () { return new Date((new Date()).getTime() + Date.prototype.getTimezoneOffset() * 60000); },

	"undefined": function () { },
	"value": function (v, newValue) { return newValue; },
	
	"void": function (v) { return v; },

	/********************** unary ***********************/

	//is type group

	"isString": function (v) { if (typeof v === "string") return v; },
	"isBoolean": function (v) { if (typeof v === "boolean") return v; },
	"isNumber": function (v) { if (typeof v === "number" && !isNaN(v)) return v; },
	"isInteger": function (v) { if (typeof v === "number" && (v % 1) === 0) return v; },
	"isDate": function (v) { if (v instanceof Date) return v; },
	"isArray": function (v) { if (v instanceof Array) return v; },

	//to type group

	"toString": function (v) { return (typeof v === "string") ? v : defaultOperatorSet.isString("" + v); },
	"toBoolean": function (v) {
		if (typeof v === "string") {
			if (v.match(/^(true|yes)$/i)) return true;
			if (v.match(/^(false|no|0)$/i)) return false;
		}
		return !!v;
	},
	"toNumber": function (v) { if (isNaN(v)) return; return (typeof v === "number") ? v : defaultOperatorSet.isNumber((new Number(v)).valueOf()); },	//valueOf: typeof (new Number(...))==="object"
	"toInteger": function (v) { return (typeof v === "number" && v % 1 === 0) ? v : defaultOperatorSet.isInteger(parseInt(v)); },
	"toDate": function (v) { return (v instanceof Date) ? v : defaultOperatorSet.isDate(new Date(v)); },

	//is value group

	"isNull": function (v) { if (v === null) return v; },
	"isEmpty": function (v) { if (!v) return v; },
	"isZero": function (v) { if (v === 0 || v === "0") return 0; },
	"isTrue": function (v) { if (v) return v; },
	"isFalse": function (v) { if (!v) return v; },

	//to value group

	"toNull": function (v) { return v ? v : null; },
	"toEmpty": function (v) { return v ? v : ""; },  //empty string ""

	//string tool

	"trim": function (v) { return v.replace(/^\s+|\s+$/g, ""); },
	"trimLeft": function (v) { return v.replace(/^\s+/, ""); },
	"trimRight": function (v) { return v.replace(/\s+$/, ""); },

	//number tool

	"++": function (v) { return ++v; },
	"--": function (v) { return --v; },

	//other

	"!": function (v) { return !v; },

	/********************** binary ***********************/

	//compare group

	">=": function (v, vc) { if (v >= vc) return v; },
	">": function (v, vc) { if (v > vc) return v; },
	"<=": function (v, vc) { if (v <= vc) return v; },
	"<": function (v, vc) { if (v < vc) return v; },
	"==": function (v, vc) { if (v == vc) return v; },
	"===": function (v, vc) { if (v === vc) return v; },

	"minLength": function (v, vc) { if (v.length >= vc) return v; },
	"maxLength": function (v, vc) { if (v.length <= vc) return v; },
	"length": function (v, vc) { if (v.length == vc) return v; },
	"startWith": function (v, vc) { if (v.substring(0, vc.length) == vc) return v; },
	"endWith": function (v, vc) { if (v.slice(-vc.length) == vc) return v; },

	//RegRxp group

	"match": function (v, reg) { if (v.match(reg)) return v; },

	//RegRxp group shortcut, string format

	"isTime19": function (v) { if (v.match(/^\d{4}-[01]\d-[0123]\d [012]\d:[0-5]\d:[0-5]\d$/)) return v; },  //like "2016-09-20 02:34:56"
	"isDate10": function (v) { if (v.match(/^\d{4}-[01]\d-[0123]\d$/)) return v; },  //like "2016-09-20"
	"isTimeHM5": function (v) { if (v.match(/^\d\d:[0-5]\d$/)) return v; },  // HH:MM, where HH can be 00-99, like "23:59"  or "99:30"

	//number tool

	"+": function (v, p) { return v + p; },
	"-": function (v, p) { return v - p; },


	/********************** ternary ***********************/

	//if group

	"if": function (v, vt, tf) { return v ? vt : vf; },

	//if group shortcut

	"ifTrue": function (v, vt) { return v ? vt : v; },
	"ifFalse": function (v, vf) { return v ? v : vf; },

	"ifVoid": function (v, vi) { return v ? v : vi; },

}

var shortcut = {
	"string": "toString",
	"boolean": "toBoolean",
	"number": "toNumber",
	"integer": "toInteger",
	"date": "toDate",

	"isInt": "isInteger",
	"toInt": "toInteger",
	"int": "integer",
	"isBool": "isBoolean",
	"toBool": "toBoolean",
	"bool": "boolean",

	"min": ">=",
	"max": "<=",

	"not": "!",

	"=": "value",
};

for (var i in shortcut) { defaultOperatorSet[i] = defaultOperatorSet[shortcut[i]]; }


/////////////////////////////////////////////////
// value operator

var STEP_MAX= 100;

//return new index, or `undefined`
function findLabel( operatorArray, index, direction, label ){
	label=":"+label;
	
	var i;
	if( direction!="-" ){
		var imax=operatorArray.length;
		for(i=index+1;i<imax;i++){
			if( operatorArray[i]==label ) return i;
		}
	}
	
	if( direction!="+" ){
		for(i=index-1;i>=0;i--){
			if( operatorArray[i]==label ) return i;
		}
	}
	
	if( label===":last" ) return operatorArray.length-1;
	if( label===":first" ) return 0;
}

var regJumpCommand= /\:([\!]?)([\+\-]?)(\$|\$\$\-?|\w+)$/;

/*
function transferValue( v, operatorArray [, operatorSet [, replaceMode]] )

return:
	when success, return a result value,
	when fail, return an Error object.
*/
function transferValue( v, operatorArray, operatorSet, replaceMode ) {
	if (!operatorSet){ operatorSet = defaultOperatorSet; }
	else if( ! replaceMode ){
		operatorSet= Object.assign( Object.create(defaultOperatorSet), operatorSet );
	}

	var i, imax = operatorArray.length, op, typeName, newV, opi, thisObject, arg, mrCmd,n,step=0, isFail;
	try{
		for (i = 0; i < imax; i++) {

			mrCmd = null;

			op = operatorArray[i];
			typeName = typeof op;

			if (typeName === "string") {
				
				if( op.match( /^\:\w+$/ ) ) continue;	//a label
				
				mrCmd = op.match(regJumpCommand);
				opi = (mrCmd) ? op.slice(0, -mrCmd[0].length) : op;
				if (!(opi in operatorSet)) { return Error("operator item unfound, idx " + i + ", " + op); }
				newV = operatorSet[opi](v);
			}
			else if (typeName === "function") {
				newV = op(v);
			}
			else if (op instanceof RegExp) {
				newV = defaultOperatorSet["match"](v, op);
			}
			else if (op instanceof Array) {
				//normalize format c and d
				switch (op.length) {
					case 4:		//normalized format d
						if (op[3] !== 1) return Error("abnormal operator format, idx " + i + ", " + op);
						break;
					case 2:		//format c
						op.unshift((typeof op[0] === "string") ? operatorSet : null);
						//continue next `case 3`
					case 3:		//format d
						if (op[2] instanceof Array) {
							op[2].unshift(null);
						}
						else {
							op[2] = [null, op[2]];
						}

						op.push(1);		//normalized flag
						break;
					default:
						return Error("unknown operator format, idx " + i + ", " + op);
				}

				thisObject = op[0];
				opi = op[1];
				arg = op[2];

				typeName = typeof opi;

				if (typeName === "string") {
					mrCmd = opi.match(regJumpCommand);
					if (mrCmd) opi = opi.slice(0, -mrCmd[0].length);
					if (!(opi in thisObject)) { return Error("operator item unfound, idx " + i + ", " + op); }
					arg[0] = v;
					newV = thisObject[opi].apply(thisObject, arg);
				}
				else if (typeName === "function") {
					arg[0] = v;
					newV = opi.apply(thisObject, arg);
				}
				else { return Error("unknown operator item type, idx " + i + ", " + op); }
			}
			else { return Error("unknown operator item type, idx " + i + ", " + op); }

			//check value
			
			isFail= (typeof newV === "undefined") || ( newV instanceof Error );
			//console.log( "isFail= " + isFail, isFail && newV);
			
			if( mrCmd ){
				//special <label>
				if( mrCmd[3]==="$$" ) { return isFail?( newV || Error("operator item process error, idx " + i + ", " + op) ): newV; }
				if( mrCmd[3]==="$$-" ) { return isFail? v: newV; }
				
				if( (mrCmd[1]=="!" && isFail) || (mrCmd[1]!="!" && !isFail) ){
					if( mrCmd[3]==="$" ){
						return isFail? v: newV;
					}
					
					i= findLabel( operatorArray, i, mrCmd[2], mrCmd[3] );
					if(  typeof i === "undefined" ){ return Error("label unfound, "+ mrCmd[3] +",idx " + i + ", " + op); }
					i--;	//for next loop i++
				}
				if( !isFail ) v= newV;
			}
			else{
				if( isFail ){ return newV || Error("operator item process error, idx " + i + ", " + op); }
				
				v = newV;
			}
			
			step++;
			if( step > STEP_MAX ){ return Error("operator steps more than "+STEP_MAX+", idx " + i + ", " + op); }
		}
		return v;
	}
	catch(ex){
		console.log(ex);
		return Error("operator exception, idx " + i + ", " + op );
	}
}

/////////////////////////////////////////////////
// combine tools

//function transferArray(destArray, srcArray, operatorArray [, operatorSet [, replaceMode ]] )
function transferArray(destArray, srcArray, operatorArray, operatorSet, replaceMode ) {
	var i, imax=srcArray.length,v;
	for(i=0;i<imax;i++){
		v= transferValue(srcArray[i], operatorArray, operatorSet, replaceMode );
		if( v instanceof Error ){
			return Error( "transferArray fail at i=" + i +", " + (v.message || "transferValue fail") );
		}
		destArray[i]=  v;
	}
	return destArray;
}

/*
function transferObject(destObject, srcObject, operatorArrayMapping [, skipUnfound [, operatorSet [, replaceMode ]]] )

	operatorArrayMapping:
		the mapping name:
			varName + ["?"] + [":array"]
				
				"?"
					try get default from call-array, event if varName unfound in `srcObject`;
				
				":array"
					call the transferArray()
*/
function transferObject(destObject, srcObject, operatorArrayMapping, skipUnfound, operatorSet, replaceMode) {
	var i, imax, oi, v, nm, isArray, hasDefault;
	for (i in operatorArrayMapping) {
		
		nm= i;
		isArray= (nm.slice(-6)==":array");
		if(isArray) nm=nm.slice(0,-6);
		
		hasDefault= nm.charAt(nm.length-1)==="?";
		if( hasDefault ) nm=nm.slice(0,-1);
		
		if (nm in srcObject || hasDefault ) {
			v = isArray ? transferArray([], srcObject[nm], operatorArrayMapping[i] ) : transferValue(srcObject[nm], operatorArrayMapping[i]);
			if( v instanceof Error ){
				return Error( "transferObject fail at i=" + i +", " + (v.message || ((isArray?"transferValue":"transferValue")+" fail")) );
			}
			destObject[nm] = v;
		}
		else if (!skipUnfound) return Error("transferObject item not exists, " + i + ", " + operatorArrayMapping[i]);
	}
	return destObject;
}


/////////////////////////////////////////////////

module.exports = transferValue;

module.exports.defaultOperatorSet= defaultOperatorSet;

module.exports.transferValue= transferValue;
module.exports.transferArray= transferArray;
module.exports.transferObject= transferObject;

