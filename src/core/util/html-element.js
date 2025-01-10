class Element {
	#tagName = "";
	#classList = [];
	#attribute = new Map();
	#textContent = "";
	#childNodes = [];
	#parentNode = null;
	#operation = {
		singleTag : false,
		attribute : [],
		class : []
	};

	constructor( tagName, operation ) {
		if ( !tagName && !operation[ "annotation" ] ) throw new Error( `The tag name cannot be empty` );

		if ( operation ) {
			this.#operation = operation;

			if ( Array.isArray( this.#operation[ "attribute" ] ) && this.#operation[ "attribute" ].length > 0 ) {
				this.#operation[ "attribute" ].forEach( ( attribute ) => {
					const key = attribute[ 0 ];
					const value = attribute[ 1 ];
					this.setAttribute( key, value );
				} );
			}
			if ( Array.isArray( this.#operation[ "class" ] ) && this.#operation[ "class" ].length > 0 ) {
				this.addClass( ...this.#operation[ "class" ] );
			}
		}
		this.#tagName = tagName;
	}

	get childNodes() {
		return this.#childNodes;
	}

	get parentNode() {
		return this.#parentNode;
	}

	#classNameDetection = ( className ) => {
		if ( typeof className !== "string" ) throw new Error( `The class name must be of string type` );
		if ( /^\d/.test( className ) ) throw new Error( `The first letter of the class name cannot be a number` );
		return true;
	};

	#attributeDetection = ( attrName ) => {
		if ( typeof attrName !== "string" ) throw new Error( `The attribute name must be of string type` );
		if ( /^\d/.test( attrName ) ) throw new Error( `The first letter of the attribute name cannot be a number` );
		return true;
	};

	setTextContent( text ) { this.#textContent = text; }

	getTextContent() { return this.#textContent; }

	toString() {
		let className = this.#classList.length > 0 ? ` class="${ this.#classList.join( " " ) }"` : "";
		let attribute = Array.from( this.#attribute.entries() )
		.map( ( [ key, value ] ) => {
			if ( key === "class" ) className = "";
			return ` ${ key }="${ value }"`;
		} )
		.join( "" );
		let children = this.#childNodes.map( child => child.toString() ).join( "" );

		if ( this.#operation[ "annotation" ] ) return `<!--${ this.#textContent }-->`;

		if ( this.#operation[ "singleTag" ] ) {
			return `<${ this.#tagName }${ attribute }${ className } />`;
		} else
			return `<${ this.#tagName }${ attribute }${ className }>${ children }${ this.#textContent }</${ this.#tagName }>`;
	}

	addClass( ...className ) {
		className.forEach( value => {
			if ( this.#classNameDetection( value ) ) this.#classList.push( value );
		} );
	}

	removeClass( className ) {
		const index = this.#classList.indexOf( className );
		if ( index > -1 ) this.#classList.splice( index, 1 );
	}

	setAttribute( name, value ) {
		if ( this.#attributeDetection( name ) ) this.#attribute.set( name, value );
	}

	removeAttribute( name ) {
		if ( this.#attributeDetection( name ) ) this.#attribute.delete( name );
	}

	getAttribute( name ) {
		if ( this.#attributeDetection( name ) ) return this.#attribute.get( name );
	}

	getAttributeNames() {
		return Array.from( this.#attribute.keys() );
	}

	appendChild( ...childs ) {
		childs.forEach( child => {
			if ( child instanceof Element ) {
				this.#childNodes.push( child );
				child.#parentNode = this;
			} else {
				throw new Error( "appendChild only accepts instances of Element" );
			}
		} );
	}

	removeChild( child ) {
		const index = this.#childNodes.indexOf( child );
		if ( index > -1 ) {
			this.#childNodes.splice( index, 1 );
			child.#parentNode = null;
		}
	}

	replaceChild( oldChild, newChild ) {
		const index = this.#childNodes.indexOf( oldChild );
		if ( index > -1 ) {
			this.#childNodes[ index ] = newChild;
			newChild.#parentNode = this;
			oldChild.#parentNode = null;
		}
	}
}

export function createHTMLElement( tagName, operation = null ) {
	return new Element( tagName, operation );
}