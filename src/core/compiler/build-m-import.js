import { parse } from "node-html-parser";

export const BuildMImport = ( element, templateContent ) => {
	const importElement = element.getElementsByTagName( "import" ).at( 0 );
	const temp = parse( templateContent );
	if ( importElement ) {
		const obj = [];

		importElement.getElementsByTagName( "m" ).forEach( ( m ) => {
			m.getAttribute( "tag" ) && obj.push( {
				tag : m.getAttribute( "tag" ),
				src : m.innerHTML
			} );
		} );
		importElement.remove();

		obj.forEach( o => {
			temp.getElementsByTagName( o.tag ).forEach( ( e ) => {
				e.tagName = "m-import";
				e.setAttribute( "src", o.src );
			} );
		} );
	}
	return temp.innerHTML || "";
}