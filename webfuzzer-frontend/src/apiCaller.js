import axios from 'axios';
const globalConfig = require('./globalConfig')
const BASE_URL = globalConfig.BASE_URL
const callApi = async (endpoint, method = 'get', body) => {
    try {
        let { data } = await axios({
            method: method,
            url: `${BASE_URL}${endpoint}`,
            data: body
        })
        return data
    } catch (err) {

        console.log(err)
        return null
    }

}
export default callApi