export class DatePro {
	/**
	 * 格式化日期字符串为"YYYY-MM-DD"格式
	 */
	static formatDateString( dateString ) {
		let parts = dateString.split( "-" );
		let year = parts[ 0 ];
		let month = ( "0" + parts[ 1 ] ).slice( -2 ); // 补零
		let day = ( "0" + parts[ 2 ] ).slice( -2 ); // 补零

		return year + "-" + month + "-" + day;
	}

	/**
	 * 格式化日期对象为模板字符串日期
	 * @param {Date} date - 日期对象
	 * @param {string} template - 模板字符串
	 * @returns {string} 格式化后的日期字符串
	 */
	static format( date, template ) {
		const year = date.getFullYear();
		const month = ( "0" + ( date.getMonth() + 1 ) ).slice( -2 );
		const day = ( "0" + date.getDate() ).slice( -2 );
		const hour = ( "0" + date.getHours() ).slice( -2 );
		const minute = ( "0" + date.getMinutes() ).slice( -2 );
		const second = ( "0" + date.getSeconds() ).slice( -2 );

		return template
		.replace( "YYYY", year )
		.replace( "MM", month )
		.replace( "DD", day )
		.replace( "HH", hour )
		.replace( "mm", minute )
		.replace( "ss", second );
	}

	/**
	 * 将时间戳转换为模板字符串日期
	 * @param {string} template - 模板字符串
	 * @param {number} [timestamp=Date.now()] - 时间戳,单位为毫秒
	 * @returns {string} 格式化后的日期字符串
	 */
	static formatTimestamp( template = "YYYY-MM-DD HH:mm:ss", timestamp = Date.now() ) {
		return this.format( new Date( timestamp ), template );
	}

	/**
	 * 格式化当前日期或给定时间戳为模板字符串日期
	 * @param {string} template - 模板字符串
	 * @returns {string} 格式化后的日期字符串
	 */
	static formatDate( template = "YYYY-MM-DD HH:mm:ss" ) {
		return this.format( new Date(), template );
	}
}