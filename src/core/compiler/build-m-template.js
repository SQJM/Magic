import htmlMinify from "html-minifier";

export const BuildMTemplate = ( element, templateConfig, build_magic_config ) => {
	const template = element.getElementsByTagName( "template" ).at( 0 );
	if ( template ) {
		template.hasAttribute( "tag" ) && ( templateConfig.tagName = template.getAttribute( "tag" ) );
		const c = template.innerHTML || "";
		element.removeChild( template );
		if ( build_magic_config[ "min-code" ][ "html" ] ) {
			return htmlMinify.minify( c, {
				"collapseWhitespace" : true,
				"conservativeCollapse" : false,
				"preserveLineBreaks" : false,
				"removeComments" : true,
				"removeCDATASections" : true,
				"removeTagWhitespace" : false,
				"removeAttributeQuotes" : true,
				"removeRedundantAttributes" : true,
				"useShortDoctype" : true,
				"keepClosingSlash" : true,
				"minifyJS" : false,
				"minifyCSS" : false,
				"minifyURLs" : true,
				"removeEmptyAttributes" : true,
				"removeScriptTypeAttributes" : false,
				"removeStyleLinkTypeAttributes" : false,
				"sortClassName" : true,
				"sortAttributes" : true,
				"ignoreCustomComments" : [ "^!", "^html-report" ],
				"customAttrCollapse" : false,
				"decodeEntities" : true
			} );
		}
		return c;
	} else {
		return "";
	}
}