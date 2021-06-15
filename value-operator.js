
"use strict";

/*

* Operator call-array item format

	format a:
		function	=>	my_operator( v ) { ... }, a user-defined operator function, that return transfered value, or return `undefined` or Error object if fail.
			my_operator(v)

	format b:
		"string"	=>	"operator_name"
			operatorSet["operator_name"]( v )

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

* Operator call-array break command format

	A break command is defined as a string `":$"` or `":$n"` at the end of "operator_name".

		when the operator return not-`undefined` value,
			command `":$"` break the process and return.
			command `":$n"` skip `n` steps.

		when the operator return `undefined` or Error,
			process the next with last not-`undefined` value.

*/

/////////////////////////////////////////////////
// default operator set

var defaultOperatorSet = {

	/********************** constant ***********************/

	"now": function () { return new Date(); },
	"nowTime": function () { return (new Date()).getTime(); },
	"utcNow": function () { return new Date((new Date()).getTime() + Date.prototype.getTimezoneOffset() * 60000); },

	"undefined": function () { },
	"value": function (v, newValue) { return newValue; },

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

var LOOP_MAX= 100;

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

	var i, imax = operatorArray.length, op, typeName, newV, opi, thisObject, arg, mBreak,n,loop=0;
	try{
		for (i = 0; i < imax; i++) {

			mBreak = null;

			op = operatorArray[i];
			typeName = typeof op;

			if (typeName === "string") {
				mBreak = op.match(/\:\$\d*$/);
				opi = (mBreak) ? op.slice(0, -mBreak[0].length) : op;
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
					mBreak = opi.match(/\:\$\d*$/);
					if (mBreak) opi = opi.slice(0, -mBreak[0].length);
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
			if( (typeof newV === "undefined") || ( newV instanceof Error ) ) {
				if (!mBreak) {
					return Error("operator item process error, idx " + i + ", " + op);
				}
			}
			else {
				if (mBreak) {
					if (mBreak[0].length === 2) return newV;
					else {
						n=parseInt(mBreak[0].slice(2));
						//console.log( mBreak[0], n );
						if( !n && n!==0 ) return Error("operator item break cmd error, idx " + i + ", " + op);
						i += n;
					}
				}

				v = newV;
			}
			
			loop++;
			if( loop > LOOP_MAX ) return Error("operator loop>"+LOOP_MAX+", idx " + i + ", " + op);
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

//function transferObject(destObject, srcObject, operatorArrayMapping [, skipUnfound [, operatorSet [, replaceMode ]]] )
function transferObject(destObject, srcObject, operatorArrayMapping, skipUnfound, operatorSet, replaceMode) {
	var i, imax, oi, v, nm, isArray;
	for (i in operatorArrayMapping) {
		
		nm= i;
		isArray= (nm.slice(-6)==":array");
		if(isArray) nm=nm.slice(0,-6);
		
		if (nm in srcObject) {
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

