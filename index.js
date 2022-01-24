import { Router } from 'itty-router'
import xss from 'xss'
/**
 * Example someHost is set up to take in a JSON request
 * Replace url with the host you wish to send requests to
 * @param {string} someHost the host to send the request to
 * @param {string} url the URL to send the request to
 */
const cfDns = 'https://1.1.1.1/dns-query?name='
const router = Router()

//Root
router.get('/', () => {
    return new Response('Enter domain to lookup')
})

router.get('/:text', async ({ params }) => {
    /**
     * gatherResponse awaits and returns a response body as a string.
     * Use await gatherResponse(..) in an async function to get the response body
     * @param {Response} response
     */
    async function gatherResponse(response) {
        const { headers } = response
        const contentType = headers.get('content-type') || ''
        if (contentType.includes('application/dns-json')) {
            return await response.json()
        } else if (contentType.includes('application/text')) {
            return response.text()
        } else if (contentType.includes('text/html')) {
            return response.text()
        } else {
            return response.text()
        }
    }

    let cleanParam = xss(decodeURIComponent(params.text), {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script'],
    })

    async function dnsReqs() {
        const init = {
            headers: {
                accept: 'application/dns-json',
            },
        }
        const dnsTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']
        let dnsResults = {}

        for (let i = 0; i < dnsTypes.length; i++) {
            let url = cfDns + cleanParam + '&type=' + dnsTypes[i]
            const response = await fetch(url, init)
            dnsResults[dnsTypes[i]] = await gatherResponse(response)
        }
        return dnsResults
    }

    async function parseDnsResp() {
        let dnsRes = await dnsReqs()

        let aRes = dnsRes['A']['Answer']
        let aaaaRes = dnsRes['AAAA']['Answer']
        let cnameRes = dnsRes['CNAME']['Answer']
        let mxRes = dnsRes['MX']['Answer']
        let txtRes = dnsRes['TXT']['Answer']
        let nsRes = dnsRes['NS']['Answer']
        let soaRes = dnsRes['SOA']['Answer']

        function aHtml() {
            if (aRes != null && aRes[0]['type'] == 1) {
                let aResHtml = `<tr><td>A</td>`

                Object.entries(aRes).forEach(([key, value]) => {
                    aResHtml =
                        aResHtml +
                        `<td>${JSON.stringify(aRes[key]['data'])}</td>`
                })

                aResHtml = aResHtml + `</tr>`
                return aResHtml
            } else {
                return ` `
            }
        }

        function aaaaHtml() {
            if (aaaaRes != null && aaaaRes[0]['type'] == 28) {
                let aaaaResHtml = '<tr><td>AAAA</td>'

                Object.entries(aRes).forEach(([key, value]) => {
                    aaaaResHtml =
                        aaaaResHtml +
                        `<td>${JSON.stringify(aaaaRes[key]['data'])}</td>`
                })

                aaaaResHtml = aaaaResHtml + `</tr>`
                return aaaaResHtml
            } else {
                return ` `
            }
        }

        function cnameHtml() {
            if (cnameRes != null && cnameRes[0]['type'] == 5) {
                let cnameResHtml = '<tr><td>CNAME</td>'

                Object.entries(cnameRes).forEach(([key, value]) => {
                    cnameResHtml =
                        cnameResHtml +
                        `<td>${JSON.stringify(cnameRes[key]['data'])}</td>`
                })

                cnameResHtml = cnameResHtml + `</tr>`
                return cnameResHtml
            } else {
                return ` `
            }
        }

        function mxHtml() {
            if (mxRes != null && mxRes[0]['type'] == 15) {
                let mxResHtml = '<tr><td>MX</td>'

                Object.entries(mxRes).forEach(([key, value]) => {
                    mxResHtml =
                        mxResHtml +
                        `<td>${JSON.stringify(mxRes[key]['data'])}</td>`
                })

                mxResHtml = mxResHtml + `</tr>`
                return mxResHtml
            } else {
                return ` `
            }
        }

        function txtHtml() {
            if (txtRes != null && txtRes[0]['type'] == 16) {
                let txtResHtml = '<tr><td>TXT</td>'

                Object.entries(mxRes).forEach(([key, value]) => {
                    txtResHtml =
                        txtResHtml +
                        `<td>${JSON.stringify(txtRes[key]['data'])}</td>`
                })

                txtResHtml = txtResHtml + `</tr>`
                return txtResHtml
            } else {
                return ` `
            }
        }

        function nsHtml() {
            if (nsRes != null && nsRes[0]['type'] == 2) {
                let nsResHtml = '<tr><td>NS</td>'

                Object.entries(nsRes).forEach(([key, value]) => {
                    nsResHtml =
                        nsResHtml +
                        `<td>${JSON.stringify(nsRes[key]['data'])}</td>`
                })

                nsResHtml = nsResHtml + `</tr>`
                return nsResHtml
            } else {
                return ` `
            }
        }

        function soaHtml() {
            if (soaRes != null && soaRes[0]['type'] == 6) {
                let soaResHtml = '<tr><td>SOA</td>'

                Object.entries(soaRes).forEach(([key, value]) => {
                    soaResHtml =
                        soaResHtml +
                        `<td>${JSON.stringify(soaRes[key]['data'])}</td>`
                })

                soaResHtml = soaResHtml + `</tr>`
                return soaResHtml
            } else {
                return ` `
            }
        }

        const htmlPage =
            `<!DOCTYPE html>
            <head><title>DNS Records for ${cleanParam}</title></head>
<body>

  <h1>DNS Records for ${cleanParam}</h1>

<table>
<thead><tr><th>Record Type</th><th>Record Value</th></tr></thead>
<tbody>` +
            aHtml() +
            aaaaHtml() +
            cnameHtml() +
            mxHtml() +
            txtHtml() +
            nsHtml() +
            soaHtml() +
            `</tbody>
  </table>
</body>`

        return new Response(htmlPage, {
            headers: {
                'content-type': 'text/html;charset=UTF-8',
            },
        })
    }

    return await parseDnsResp()
})

router.all('*', () => new Response('404, not found!', { status: 404 }))

addEventListener('fetch', e => {
    e.respondWith(router.handle(e.request))
})
