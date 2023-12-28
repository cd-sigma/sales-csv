const fs = require("fs")
const axios = require("axios")
const path = require("path")
const _ = require("lodash")

async function getSales(startBlock, endBlock) {
    try {
        if (_.isNil(startBlock) || _.isNil(endBlock)) {
            throw new Error("startBlock or endBlock is null")
        }

        const sales = []
        const url = `https://eth-mainnet.g.alchemy.com/nft/v2/dsy5KGvlXxzphHkYbAwOnsDuqngXjsgE/getNFTSales?fromBlock=${startBlock}&toBlock=${endBlock}&limit=1000`
        const response = await axios.get(url)

        if (!response.data) {
            throw new Error("response.data is null")
        }

        if (!response.data.nftSales) {
            throw new Error("response.data.nftSales is null")
        }

        let {nftSales, pageKey} = response.data
        nftSales.forEach((sale) => {
            sales.push(sale)
        })

        if (pageKey) {
            while (true) {
                let url = `https://eth-mainnet.g.alchemy.com/nft/v2/dsy5KGvlXxzphHkYbAwOnsDuqngXjsgE/getNFTSales?fromBlock=${startBlock}&toBlock=${endBlock}&limit=1000&pageKey=${pageKey}`
                let response = await axios.get(url)
                if (!response.data) {
                    throw new Error("response.data is null")
                }

                if (!response.data.nftSales) {
                    throw new Error("response.data.nftSales is null")
                }

                let {data} = response
                data.nftSales.forEach((sale) => {
                    sales.push(sale)
                })
                if (!data.pageKey) {
                    break
                }

                pageKey = data.pageKey
            }
        }

        return sales
    } catch (error) {
        throw error
    }
}

function writeSaleToFile(sale) {
    try {
        fs.appendFileSync(
            path.join(__dirname, "numan.csv"),
            `${sale.blockNumber},${sale.buyerAddress},${sale.sellerAddress},${sale.contractAddress},${sale.quantity},${sale.marketplace},${sale.tokenId},${sale.transactionHash},${sale.sellerFee.amount},${sale.sellerFee.tokenAddress},${sale.sellerFee.decimals},${sale.sellerFee.symbol},${sale.taker},${_.isEmpty(sale.protocolFee) ? "" : sale.protocolFee.amount},${_.isEmpty(sale.protocolFee) ? "" : sale.protocolFee.tokenAddress},${_.isEmpty(sale.protocolFee) ? "" : sale.protocolFee.decimals},${_.isEmpty(sale.protocolFee) ? "" : sale.protocolFee.symbol},${_.isEmpty(sale.royaltyFee) ? "" : sale.royaltyFee.amount},${_.isEmpty(sale.royaltyFee) ? "" : sale.royaltyFee.tokenAddress},${_.isEmpty(sale.royaltyFee) ? "" : sale.royaltyFee.decimals},${_.isEmpty(sale.royaltyFee) ? "" : sale.royaltyFee.symbol}\n`,
        )
    } catch (error) {
        throw error
    }
}

;(async () => {
    try {
        let startBlock = 4000000
        let endBlock = 17500000
        const blockBatchSize = 500

        fs.writeFileSync(
            path.join(__dirname, "numan.csv"),
            "block_number,buyer,seller,nft_contract_address,number_of_items,project,token_id,transaction_hash,seller_fee_amount,seller_fee_token_address,seller_fee_token_decimals,seller_fee_token_symbol,taker,protocol_fee_amount,protocol_fee_token_address,protocol_fee_token_decimals,protocol_fee_token_symbol,royalty_fee_amount,royalty_fee_token_address,royalty_fee_token_decimals,royalty_fee_token_symbol\n",
        )

        let startTime = null,
            sales = []
        while (startBlock <= endBlock) {
            startTime = Date.now()
            sales = await getSales(startBlock, startBlock + blockBatchSize)

            sales.forEach((sale) => {
                writeSaleToFile(sale)
            })

            console.log({
                msg: "sales fetched!",
                startBlock: startBlock,
                endBlock: startBlock + blockBatchSize,
                salesCount: sales.length,
                timeTaken: (Date.now() - startTime) / 1000,
            })
            startBlock += blockBatchSize
        }
    } catch (error) {
        console.log(error)
    }
})()
