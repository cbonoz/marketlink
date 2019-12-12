import React, { Component } from "react";
import { Button, Typography, Grid, TextField } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/styles";
import ReactRotatingText from 'react-rotating-text'
import Select from 'react-select'

import MyContract from "./contracts/MyContract.json";
// import ReactTooltip from 'react-tooltip'

import getWeb3 from "./utils/getWeb3";

import { theme } from "./utils/theme";
import logo from './assets/logo.png'
import Header from "./components/Header";

import "./App.css";

const GAS = 500000;
const GAS_PRICE = "20000000000";
const ROTATE_ITEMS = ['Blockchain', 'Ethereum', 'Chainlink']

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// example address: 222 Berkeley Street Suite 600
const FIELDS = [
  'street',
  'approxemployees',
  'city',
  'code',
  'country',
  'domain',
  'email',
  'founded',
  'message',
  'name',
  'postalcode',
  'state',
  'website',
].map(x => {
  return {
    value: x,
    label: capitalize(x)
  }
})

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    email: '',
    requestId: '',
    field: FIELDS[0],
    contract: null,
    resultReceived: false,
    result: "0"
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      if (networkId !== 3) {
        throw new Error("Select the Ropsten network from your MetaMask plugin");
      }
      const deployedNetwork = MyContract.networks[networkId];
      const contract = new web3.eth.Contract(
        MyContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({ web3, accounts, contract });

      window.ethereum.on("accountsChanged", async accounts => {
        const newAccounts = await web3.eth.getAccounts();
        this.setState({ accounts: newAccounts });
      });

      // Refresh on-chain data every 1 second
      const component = this;
      async function loopRefresh() {
        await component.refreshState();
        setTimeout(loopRefresh, 2000);
      }
      loopRefresh();
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  refreshState = async () => {
    const resultReceived = await this.state.contract.methods.resultReceived().call();
    const result = (await this.state.contract.methods.result().call()).toString();
    console.log('refresh', resultReceived, result)
    this.setState({ resultReceived, result });
  };

  handleUpdateForm = (name, value) => {
    this.setState({ [name]: value });
  };

  handleRequestResult = async () => {
    const { email, field } = this.state
    console.log('requesting', email, field)
    const requestId = await this.state.contract.methods.makeRequest(email, field.value).send({ from: this.state.accounts[0], gas: GAS, gasPrice: GAS_PRICE });
    console.log('requested', requestId)
    this.setState({ requestId })
  };

  handleResetResult = async () => {
    this.setState({ email: '', field: FIELDS[0] })
    // await this.state.contract.methods
    //   .resetResult()
    //   .send({ from: this.state.accounts[0], gas: GAS, gasPrice: GAS_PRICE });
  };

  handleChange = field => {
    this.setState(
      { field },
      () => console.log(`Option selected:`, this.state.field)
    );
  };

  render() {
    if (!this.state.web3) {
      return (
        <ThemeProvider theme={theme}>
          <div className="App">
            <Header />
            <Typography>Loading Web3, accounts, and contract...</Typography>
          </div>
        </ThemeProvider>
      );
    }

    const { result, resultReceived, requestId, email, field, web3 } = this.state
    let resultString = result.toString()
    try {
      resultString = web3.utils.toUtf8(resultString)
    } catch (e) {
      //
    }

    console.log('result', resultString)

    return (
      <ThemeProvider theme={theme}>
        <div className="App">
          <Header />
          <div className='content'>

          <Typography variant="h5" style={{ marginTop: 32 }}>
            Market research powered by <ReactRotatingText items={ROTATE_ITEMS} />
.<br />
            <br/>
            <hr/>
            <br/>
          </Typography>
          <p>With just the cost of gas, use ChainLink to do a query against an email address for market research data:</p><br/>
          <Grid>
            <p className='label-text'>Enter Email:</p>
            <TextField
              id="email"
              className="input"
              value={email}
              onChange={e =>
                this.setState({ email: e.target.value })
              }
            />&nbsp;
            <div className='select-section'>
              <p className='label-text'>Select Data to mine:</p>
               <Select
                value={field}
                onChange={this.handleChange}
                options={FIELDS}
              />
            </div>&nbsp;
            <br/>
            <Button variant="contained" color="primary" onClick={() => this.handleRequestResult()}>Search</Button>
          </Grid>

          <Grid container style={{ marginTop: 32 }}>
            <Grid item xs>
              {requestId && <p>{`Last RequestId: ${requestId}`}</p>}
              <Typography variant="h5" style={{ marginTop: 32 }}>
                {`Status: ${resultReceived ? 'Done' : 'Searching...' }`}
              </Typography>
            </Grid><Grid item xs>
              {(web3 && result.length > 0) && <Typography variant="h5" style={{ marginTop: 32 }}>
                {`Found ${capitalize(field)}: ${resultString}`}
              </Typography>}
            </Grid>
          </Grid>
      </div>
        </div>
      </ThemeProvider>
    );
  }
}

export default App;
