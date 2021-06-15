# value-operator
value operator tools.

## install

`npm install value-operator`

## usage examples

```
	it('transferValue', function () {
		assert( value_operator( "100", ["int",[">",50]]) === 100 );
		assert( value_operator( "100", ["int",["<",50]]) instanceof Error );
		assert( value_operator( "abc", ["isInteger"] ) instanceof Error );
		assert( value_operator( "", ["toNull"] ) === null );
	});

	it('transferValue, break', function () {
		assert( value_operator( "a",	["toNull", "isNull:$", ["+","."]] ) === "a." );
		assert( value_operator( "",	["toNull", "isNull:$", ["+","."]] ) === null );
		
		assert( value_operator( "a",	["toNull", "isNull:$1", ["+:$","."],["=","default"]] ) === "a." );
		assert( value_operator( "",	["toNull", "isNull:$1", ["+:$","."],["=","default"]] ) === "default" );
	});

	it('transferValue, user-defined-operator', function () {
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
				b: ["toNull", "isNull:$1", ["+:$","."],["=","default"]],
			}
		);
		assert( rsl.a === "a." );
		assert( rsl.b === "default" );
	});
```
