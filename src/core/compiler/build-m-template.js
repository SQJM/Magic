export const BuildMTemplate = ( element, templateConfig ) => {
	const template = element.getElementsByTagName( "template" ).at( 0 );
	if ( template ) {
		template.hasAttribute( "tag" ) && ( templateConfig.tagName = template.getAttribute( "tag" ) );
		const c = template.innerHTML || "";
		element.removeChild( template );
		return c;
	} else {
		return "";
	}
}