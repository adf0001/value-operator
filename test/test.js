
var assert = require("assert");

var value_operator = require("../value-operator.js");

describe('value-operator', function () {

	it('transferValue', function () {
		assert( value_operator( "100", ["int",[">",50]]) === 100 );
		assert( value_operator( "100", ["int",["<",50]]) instanceof Error );
		assert( value_operator( "abc", ["isInteger"] ) instanceof Error );
		assert( value_operator( "", ["toNull"] ) === null );
		assert( value_operator( "abc", [ (v)=>{return v+"d";}] ) === "abcd" );
		assert( value_operator( "abc", [ /bc$/ ] ) === "abc" );
	});

	it('transferValue, jump', function () {
		assert( value_operator.transferValue( "a",	["toNull", "isNull:$", ["+","."]] ) === "a." );
		assert( value_operator.transferValue( "",	["toNull", "isNull:$", ["+","."]] ) === null );
		assert( value_operator.transferValue( "a",	["toNull", "isNull:!$", ["+","."]] ) === "a" );
		assert( value_operator.transferValue( "",	["toNull", "isNull:!$", ["+","."]] ) === "null." );
		
		assert( value_operator.transferValue( "a",	["toNull", "isNull:default", ["+:$","."],":default",["=","default"]] ) === "a." );
		assert( value_operator.transferValue( "",	["toNull", "isNull:default", ["+:$","."],":default",["=","default"]] ) === "default" );
		assert( value_operator.transferValue( "a",	["toNull", "isNull:!default", ["+:$","."],":default",["=","default"]] ) === "default" );
		assert( value_operator.transferValue( "",	["toNull", "isNull:!default", ["+:$","."],":default",["=","default"]] ) === "null." );
		
		assert( value_operator.transferValue( "a",	["toNull", "isNull:last", ["+:$","."],["=","default"]] ) === "a." );
		assert( value_operator.transferValue( "",	["toNull", "isNull:last", ["+:$","."],["=","default"]] ) === "default" );
		
		assert( value_operator.transferValue( "",	["toNull", "isNull:last", ["+:$","."],":last",["=","default"], ["+","."]] ) === "default." );
		
		assert( value_operator.transferValue( "a",	["toNull", "isNull:$$"] ) instanceof Error );
		assert( value_operator.transferValue( "",	["toNull", "isNull:$$"] ) === null );
		assert( value_operator.transferValue( "a",	["toNull", "isNull:$$-"] ) === "a" );
		assert( value_operator.transferValue( "",	["toNull", "isNull:$$-"] ) === null );
	});
	
	it('transferValue, jump loop', function () {
		assert( value_operator.transferValue( "a",	[["+","b"], ["maxLength:first",3], ["+","c"]] ) === "abbbc" );
		
	});
	
	it('transferValue, jump loop exceed max', function () {
		var ret= value_operator.transferValue( "a",	[["+","b"], ["maxLength:first",1000], ["+","c"]] );
		assert( ret instanceof Error );
		console.log("["+ret.message+"]");
	});

	it('transferValue, user-defined operator-set', function () {
		var myOpSet={
			myOp: (v)=>{ return v+"#"; }
		};
		
		assert( value_operator( "a",	["myOp"], myOpSet ) === "a#" );
		assert( value_operator( "a",	["myOp", ["+","."]], myOpSet ) === "a#." );
		assert( value_operator( "a",	["myOp", ["+","."]], myOpSet, true ) instanceof Error );
	});

	it('transferArray', function () {
		var rsl= value_operator.transferArray( [], ["a",""], ["toNull", "isNull:$", ["+","."]] );
		assert( rsl[0] === "a." );
		assert( rsl[1] === null );
	});

	it('transferObject', function () {
		var rsl= value_operator.transferObject( {}, {a:"a",b:""},
			{
				a: ["toNull", "isNull:$", ["+","."]],
				b: ["toNull", "isNull:1", ["+:$","."],":1",["=","default"]],
			}
		);
		assert( rsl.a === "a." );
		assert( rsl.b === "default" );
	});
	/*
	*/
});
