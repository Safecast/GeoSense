/*

  throws.js -- Adds a `throws_` method to AnotherWay test objects.

  Copyright 2005 OpenLayers Contributors. released under the BSD License.


  A reference to this file needs to be added to `run-tests.html` in the
  head element after the AnotherWay classes are created:

    <script type="text/javascript" src="throws.js"></script>

  Then, it can be used just like the `ok`, `fail` and other such methods
  in your unit tests.

  e.g. 

   t.throws_(function () {new OpenLayers.View.Map.Dynamic();},
             ReferenceError("No container supplied."),
             "OpenLayers.View.Map.Dynamic instantiation with no container "
             + "must throw.");

  This was inspired by the `assertRaises` method of Python's unittest
  library.

  Possible future enhancements:

    * Contribute to official AnotherWay distribution.
    * Use `apply` rather than require a inner function (or as an option).
    * Preserve the stack fields.

 */

Test.AnotherWay._test_object_t.prototype.throws_=function(e,t,n){var r=null;try{e()}catch(i){r=i}r?(delete r.stack,delete t.stack,this.eq(r,t,n)):this.fail(n)};