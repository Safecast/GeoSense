/*!
 * dragtable - jquery ui widget to re-order table columns 
 * version 3.0
 * 
 * Copyright (c) 2010, Jesse Baird <jebaird@gmail.com>
 * 12/2/2010
 * https://github.com/jebaird/dragtable
 * 
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * 
 * 
 * Forked from https://github.com/akottr/dragtable - Andres Koetter akottr@gmail.com
 * 
 *
 * 
 * 
 * quick down and and dirty on how this works
 * ###########################################
 * so when a column is selected we grab all of the cells in that row and clone append them to a semi copy of the parent table and the 
 * "real" cells get a place holder class witch is removed when the dragstop event is triggered
 * 
 * TODO: 
 * add / create / edit css framework
 * add drag handles
 * click event to handle drag
 * ignore class
 * 
 * 
 * clean up the api - event driven like ui autocompleate
 * make it easy to have a button swap colums
 * 
 * 
 * Events
 * change - called after the col has been moved
 * displayHelper - called before the col has started moving TODO: change to beforeChange
 * 
 * IE notes
 * 	ie8 in quirks mode will only drag once after that the events are lost
 * 
 */

(function($) {
  $.widget("jb.dragtable", {
  		//TODO: implement this
  		eventWidgetPrefix: 'dragtable',
		options: {
			//used to the col headers, data containted in here is used to set / get the name of the col
			dataHeader:'data-header',
			//class name that handles have 
			handle:'dragtable-drag-handle',
			//draggable items in cols, .dragtable-drag-handle has to match the handle options
			items: 'thead th:not( :has( .dragtable-drag-handle ) ), .dragtable-drag-handle'
			
		},
		// when a col is dragged use this to find the symantic elements, for speed
  		tableElemIndex:{  
			head: '0',
			body: '1',
			foot: '2'
		},		
		_create: function() {
			
			//console.log(this);
			//used start/end of drag
			this.startIndex = null;
			this.endIndex = null;
			this.currentColumnCollection = [];//the refferences to the table cells that are getting dragged
			
			//used on drag event to detect what direction the mouse is moving
			//init on drag start
			this.prevMouseX = 0;
			
			var self = this,
				o = self.options,
				el = self.element;
			
			//grab the ths and the handles and bind them 
			el.delegate(o.items, 'mousedown.' + self.widgetEventPrefix, function(e){
				var $handle = $(this),
					//position the drag dispaly to rel to the middle of the target co
					offsetLeft = this.offsetLeft;

				//make sure we are working with a th instead of a handle
				if( $handle.hasClass( o.handle ) ){
					
					$handle = $handle.closest('th');
					offsetLeft = $handle[0].offsetLeft;
					self._positionOffset = e.pageX + offsetLeft;

					//console.log( 'handle was clicked using th', $handle, offsetLeft)
				}
				
				var $dragDisplay = self.getCol( $handle.index() );	
				self._positionOffset = e.pageX - offsetLeft;
			
				//console.log( $handle.width(), $handle[0] )
				var half = self.currentColumnCollection[0].clientWidth / 2,
					parentOffset = self._findElementPosition(el.parent()[0]);
					
					//figure out the width of the display and the top left of it
				
               	//console.log( 'offsetLeft',offsetLeft, ' e.x',e.pageX );
                
				$dragDisplay
					.attr( 'tabindex', -1 )
	                .focus()
					.disableSelection()
					.css({
	                    top: el[0].offsetTop,
	                   //using the parentOff.set makes e.pageX reletive to the parent element. This fixes the issue of the drag display not showing up under cursor on drag.
	                    //left: ((e.pageX - parentOffset.x) + (parseInt('-' + half)))
	                    left: offsetLeft
					})
	                .insertAfter( self.element )
				
				//get the colum count
				var colCount = self.element[ 0 ]
									.getElementsByTagName( 'thead' )[ 0 ]
									.getElementsByTagName( 'tr' )[ 0 ]
									.getElementsByTagName( 'th' )
									.length - 1;
				
				//console.log( 'col count', colCount );
				
                //drag the column around
                //its jumpy if handle is used
                //self.prevMouseX = e.pageX;
                //TODO: make col switching relitvte to the silibing cols, not pageX
                self.prevMouseX = offsetLeft;
                
                	//console.log(dragDisplay)
				self._eventHelper('displayHelper', e ,{
					'draggable': $dragDisplay
				});
                
                $( document )
	                .disableSelection()
	                .css( 'cursor', 'move')
	                .bind('mousemove.' + self.widgetEventPrefix, function( e ){
                    
                	
                    var columnPos = self._findElementPosition(self.currentColumnCollection[0]),
						colHalfWidth = Math.floor( self.currentColumnCollection[0].clientWidth / 2 );
                    
                    
                    //console.log( $dragDisplay.css('left'),'e.pageX ',e.pageX,'postion offset ', self._positionOffset, 'colpos.x ', columnPos.x)
                    
                    //console.log( 'half width colHalfWidth ', colHalfWidth)
                    $dragDisplay
                    	.css( 'left', ( e.pageX - self._positionOffset ) )
                    
                    if(e.pageX < self.prevMouseX){
                    	//move left
							var threshold = columnPos.x - colHalfWidth;
							
							//console.log( 'threshold ',threshold,  e.pageX - self._positionOffset )
							if(e.pageX - self._positionOffset < threshold ){
								
								self._swapCol(self.startIndex-1);
								self._eventHelper('change',e);
							}

						}else{
							//move right
							var threshold = columnPos.x + colHalfWidth * 2;
							//console.log('move right ', columnPos.x, threshold, e.pageX );
							//move to the right only if x is greater than threshold and the current col isn' the last one
							if(e.pageX > threshold  && colCount != self.startIndex ){
								//console.info('move right');
								self._swapCol( self.startIndex + 1 );
								self._eventHelper('change',e);
							}
						}
						//update mouse position
						self.prevMouseX = e.pageX;
			
                })
                .one( 'mouseup.dragtable',function(){
                    $( document )
	                    .css({
	                        cursor: 'auto'
	                    })
	                    .enableSelection()
	                    .unbind( 'mousemove.' + self.widgetEventPrefix );
                    
                    self._dropCol($dragDisplay);
                    self.prevMouseX = 0;
                });
                                
				
				//############
			});
                
		},
		
		_setOption: function(option, value) {
			$.Widget.prototype._setOption.apply( this, arguments );
           
		},
		
		/*
		 * get the selected index cell out of table row
		 * works dam fast
		 */
		_getCells: function( elem, index ){
			var ei = this.tableElemIndex,
			
				//TODO: clean up this format 
				tds = {
					'semantic':{
						'0': [],//head throws error if ei.head or ei['head']
						'1': [],//body
						'2': []//footer
					},
					'array':[]
				};
			
			//console.log(index);
			//check does this col exsist
			if(index <= -1 || typeof elem.rows[0].cells[index] == 'undefined'){
				return tds;
			}
			for(var i = 0, length = elem.rows.length; i < length; i++){
				var td = elem.rows[i].cells[index],
					parentNodeName = td.parentNode.parentNode.nodeName;

				tds.array.push(td);
				
				if( /^tbody|TBODY/.test( parentNodeName ) ){
					
					tds.semantic[ei.body].push( td );
					
				}else if( /^thead|THEAD/.test( parentNodeName ) ){
					
					tds.semantic[ei.head].push( td );
				
				}else if( /^tfoot|TFOOT/.test( parentNodeName ) ){
					
					tds.semantic[ei.foot].push( td );
				}
				
					 		
		 	}
		 	return tds;
		},
		/*
		 * return and array of children excluding text nodes
		 * used only on this.element
		 */
		_getChildren: function(){
			
			var children = this.element[0].childNodes,
				ret = [];
			for(var i = 0, length = children.length; i < length; i++){
				var e = children[i];
				if(e.nodeType == 1){
					ret.push(e);
				}
			}
			
			return ret;
		},
		/*
		 * returns all element attrs in a string key="value" key2="value"
		 */
		_getElementAttributes: function(element){
			
        	var attrsString = '',
	        	attrs = element.attributes;
	        for(var i=0, length = attrs.length; i < length; i++) {
	            attrsString += attrs[i].nodeName + '="' + attrs[i].nodeValue+'"';
	        }
	        return attrsString;
		},
		/*
		 * currently not use - remove soon
		 */
		_swapNodes: function(a, b) {
        	var aparent = a.parentNode,
        	asibling = a.nextSibling === b ? a : a.nextSibling;
        	b.parentNode.insertBefore(a, b);
        	aparent.insertBefore(b, asibling);
     	},
     	/*
     	 * faster than swap nodes
     	 * only works if a b parent are the same, works great for colums
     	 */
     	_swapCells: function(a, b) {
        	a.parentNode.insertBefore(b, a);
     	},
     	/*
     	 * use this instead of jquery's offset, in the cases were using is faster than creating a jquery collection
     	 */
		_findElementPosition: function( oElement ) {
			if( typeof( oElement.offsetParent ) != 'undefined' ) {
				for( var posX = 0, posY = 0; oElement; oElement = oElement.offsetParent ) {
					posX += oElement.offsetLeft;
					posY += oElement.offsetTop;
				}
				return {'x':posX, 'y':posY };
			} else {
				return {'x':oElement.x, 'y':oElement.y };
			}
		},
		/*
		 * used to tirgger optional events
		 */
		_eventHelper: function(eventName ,eventObj, additionalData){
			this._trigger( 
				eventName, 
				eventObj, 
				$.extend({
					column: this.currentColumnCollection,
					order: this.order()						
				},additionalData)
			);
		},
		/*
		 * build copy of table and attach the selected col to it, also removes the select col out of the table
		 * @returns copy of table with the selected col
		 */		
		getCol: function(index){
			//console.log('index of col '+index);
			//drag display is just simple html
			//console.profile('selectCol');
			
			//colHeader.addClass('ui-state-disabled')

			var $table = this.element,
				self = this,
				eIndex = self.tableElemIndex,
				//BUG: IE thinks that this table is disabled, dont know how that happend
				$dragDisplay = $('<table '+self._getElementAttributes($table[0])+'></table>')
									.addClass('dragtable-drag-col');
			
			//start and end are the same to start out with
			self.startIndex = self.endIndex = index;
		

		 	var cells = self._getCells($table[0], index);
			self.currentColumnCollection = cells.array;
			//console.log(cells);
			//################################
			
			//TODO: convert to for in // its faster than each
			$.each(cells.semantic,function(k,collection){
				//dont bother processing if there is nothing here
				
				if(collection.length == 0){
					return;
				}
                
                if ( k == '0' ){
                    var target = document.createElement('thead');
						$dragDisplay[0].appendChild(target);
						// 
						// var target = $('<thead '+self._getElementAttributes($table.children('thead')[0])+'></thead>')
						// .appendTo($dragDisplay);
                }else{ 
                    var target = document.createElement('tbody');
						$dragDisplay[0].appendChild(target);
						// var target = $('<tbody '+self._getElementAttributes($table.children('tbody')[0])+'></tbody>')
						// .appendTo($dragDisplay);
	

                }

				for(var i = 0,length = collection.length; i < length; i++){
					
					var clone = collection[i].cloneNode(true);
					collection[i].className+=' dragtable-col-placeholder';
					var tr = document.createElement('tr');
					tr.appendChild(clone);
					//console.log(tr);
					
					
					target.appendChild(tr);
					//collection[i]=;
				}
			});
    		// console.log($dragDisplay);
    		//console.profileEnd('selectCol')
            $dragDisplay  = $('<div class="dragtable-drag-wrapper"></div>').append($dragDisplay)
    		return $dragDisplay;
		},
		
		
		/*
		 * move column left or right
		 */
		_swapCol: function( to ){
			
			//cant swap if same postion
			if(to == this.startIndex){
				return false;
			}
			
			var from = this.startIndex;
			this.endIndex = to;
			
	        if(from < to) {
	        	//console.log('move right');
	        	for(var i = from; i < to; i++) {
	        		var row2 = this._getCells(this.element[0],i+1);
	        	//	console.log(row2)
	        		for(var j = 0, length = row2.array.length; j < length; j++){
	          			this._swapCells(this.currentColumnCollection[j],row2.array[j]);
	          		}
	          	}
	        } else {
	        	//console.log('move left');
	        	for(var i = from; i > to; i--) {
	            	var row2 = this._getCells(this.element[0],i-1);
	            	for(var j = 0, length = row2.array.length; j < length; j++){
	          			this._swapCells(row2.array[j],this.currentColumnCollection[j]);
	          		}
	        	}
	        }
	        
	        this.startIndex = this.endIndex;
		},
		/*
		 * called when drag start is finished
		 */
		_dropCol: function($dragDisplay){
		//	console.profile('dropCol');
			var self = this;
			
			if($dragDisplay){
				$dragDisplay.remove();
			}
			//remove placeholder class
			for(var i = 0, length = self.currentColumnCollection.length; i < length; i++){
				var td = self.currentColumnCollection[i];
				
				td.className = td.className.replace(' dragtable-col-placeholder','');
			}
			

		},
		/*
		 * get / set the current order of the cols
		 */
		order: function(order){
			var self = this,
				elem = self.element,
				options = self.options,
				headers = elem.find('thead tr:first').children('th');
				
			
			if(order == undefined){
				//get
				var ret = [];
				headers.each(function(){
					var header = this.getAttribute(options.dataHeader);
					if(header == null){
						//the attr is missing so grab the text and use that
						header = $(this).text();
					}
					
					ret.push(header);
					
				});
				
				return ret;
				
			}else{
				//set
				//headers and order have to match up
				if(order.length != headers.length){
					//console.log('length not the same')
					return self;
				}
				for(var i = 0, length = order.length; i < length; i++){
					 
					 var start = headers.filter('['+ options.dataHeader +'='+ order[i] +']').index();
					 if(start != -1){
					 	//console.log('start index '+start+' - swap to '+i);
					 	self.startIndex = start;
					 	
						self.currentColumnCollection = self._getCells(self.element[0], start).array;

					 	self._swapCol(i);
					 }
					 
					 
				}
				self._eventHelper('change',{});
				return self;
			}
		},
				
		destroy: function() {
			var self = this,
				o = self.options;
			
			this.element.undelegate( o.items, 'mousedown.' + self.widgetEventPrefix );
            
		}

        
	});

})(jQuery);