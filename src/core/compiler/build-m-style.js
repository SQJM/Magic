import { compressCSS } from "../util/compress-css.js";

export const BuildMStyle = ( element, build_magic_config, fileName ) => {
	let styleContent;
	const style = element.getElementsByTagName( "style" ).at( 0 );
	if ( style ) {
		let result = style.innerHTML;
		if ( build_magic_config[ "min-code" ][ "css" ] ) {
			result = compressCSS( result );
		}
		if ( style.hasAttribute( "global" ) )
			styleContent = `<style m-style-name="${ fileName }">${ result }</style>`;
		else
			styleContent = `<style m-style-name="${ fileName }">*[m-name="${ fileName }"] {${ result } }</style>`;
	}
	return styleContent;
}