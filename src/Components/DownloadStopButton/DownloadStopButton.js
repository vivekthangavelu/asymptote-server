import React, { memo, Component } from 'react';
import cssStyle from './DownloadStopButton.module.css';
import { connect } from 'react-redux';
import { actionFact } from '../../Store/store';
import { Ajax, workspaceInspector, decode } from '../../Util/util';

const ContainerConstructor = connect((store) => ({ workspaces: store.workspaces, selectedWorkspace: store.selectedWorkspace }),
  {
    getRunResponse: actionFact.getRunResponse,
  })

const activeColor = "rgb(200, 200, 200)";
const inactiveColor = "rgb(119, 136, 153)";

const DownloadStopButton = ContainerConstructor(class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonType: "Download"
    }
  }

  render() {
    const currentWorkspace = workspaceInspector(this.props);
    const noWorkspace = currentWorkspace.id === null;
    const emptyEditor = currentWorkspace.codeText === "";
    const onlyCodeChecked = currentWorkspace.codeOption.checked && !currentWorkspace.outputOption.checked;
    const onlyOutputChecked = !currentWorkspace.codeOption.checked && currentWorkspace.outputOption.checked;
    const bothOptionsChecked = currentWorkspace.codeOption.checked && currentWorkspace.outputOption.checked;

    let downloadBtn = "";
    let stopBtn = "";

    if (this.state.buttonType === "Download") {
      return (
        <div className={this.props.cssClass}>
          <button className={cssStyle.Btn} ref={(button) => { downloadBtn = button }}
            style={(noWorkspace || emptyEditor) ? { color: inactiveColor } : { color: activeColor }}
            disabled={(noWorkspace || emptyEditor)}
            onClick={(event) => {
              downloadBtn.disabled = true;
              const link = document.createElement("a");
              const data = {
                reqType: "preDownloadRun",
                workspaceId: currentWorkspace.id,
                workspaceName: currentWorkspace.name.current,
                codeOption: currentWorkspace.codeOption.checked,
                outputOption: currentWorkspace.outputOption.checked,
                codeText: currentWorkspace.codeText,
                requestedOutformat: currentWorkspace.outformat,
                isUpdated: currentWorkspace.output.isUpdated,
              };

              // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  ONLY CODE
              if (onlyCodeChecked) {
                const dataJSON = JSON.stringify(data);
                Ajax("POST", "/").contentType("json").done(dataJSON, (Response) => {
                  let response = decode(Response);
                  if (response.responseType === "ERROR" || response.responseType === "NO_ASY_FILE") {
                    this.props.getRunResponse(currentWorkspace.id, response);
                    this.setState({
                      buttonType: "Download",
                    })
                  } else {
                    Ajax("POST", "/clients", { responseType: "blob" }).contentType("json").done(dataJSON, (response) => {
                      link.href = window.URL.createObjectURL(response);
                      link.setAttribute("download", currentWorkspace.name.current + ".asy");
                      link.click();
                      this.setState({
                        buttonType: "Download",
                      })
                    });
                    this.setState({
                      buttonType: "Stop",
                    })
                  }
                });

                // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  ONLY OUTPUT
              } else if (onlyOutputChecked) {
                const dataJSON = JSON.stringify(data);
                Ajax("POST", "/").contentType("json").done(dataJSON, (Response) => {
                  let response = decode(Response);
                  if (response.responseType === "ERROR" || response.responseType === "NO_OUTPUT_FILE") {
                    this.props.getRunResponse(currentWorkspace.id, response);
                    this.setState({
                      buttonType: "Download",
                    })
                  } else {
                    Ajax("POST", "/clients", { responseType: "blob" }).contentType("json").done(dataJSON, (response) => {
                      link.href = window.URL.createObjectURL(response);
                      link.setAttribute("download", currentWorkspace.name.current + "." + currentWorkspace.outformat);
                      link.click();
                      this.setState({
                        buttonType: "Download",
                      })
                    });
                  }
                });
                this.setState({
                  buttonType: "Stop",
                })

                // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  BOTH CODE & OUTPUT
              } else if (bothOptionsChecked) {
                let dataJSON = JSON.stringify(data);
                Ajax("POST", "/").contentType("json").done(dataJSON, (Response) => {
                  let response = decode(Response);
                  if (response.responseType === "ERROR" || response.responseType === "NO_ASY_FILE") {
                    this.props.getRunResponse(currentWorkspace.id, response);
                    this.setState({
                      buttonType: "Download",
                    })
                  } else if (response.responseType === "NO_OUTPUT_FILE") {
                    data.codeOption = true;
                    data.outputOption = false;
                    dataJSON = JSON.stringify(data);
                    Ajax("POST", "/clients", { responseType: "blob" }).contentType("json").done(dataJSON, (response) => {
                      link.href = window.URL.createObjectURL(response);
                      link.setAttribute("download", currentWorkspace.name.current + ".asy");
                      link.click();
                      this.setState({
                        buttonType: "Download",
                      })
                    });
                  } else {
                    data.codeOption = true;
                    data.outputOption = false;
                    dataJSON = JSON.stringify(data);
                    Ajax("POST", "/clients", {
                      responseType: "blob"
                    }).contentType("json").done(dataJSON, (response) => {
                      link.href = window.URL.createObjectURL(response);
                      link.setAttribute("download", currentWorkspace.name.current + ".asy");
                      link.click();
                    });
                    data.codeOption = false;
                    data.outputOption = true;
                    dataJSON = JSON.stringify(data);
                    Ajax("POST", "/clients", { responseType: "blob" }).contentType("json").done(dataJSON, (response) => {
                      link.href = window.URL.createObjectURL(response);
                      link.setAttribute("download", currentWorkspace.name.current + "." + currentWorkspace.outformat);
                      link.click();
                      this.setState({
                        buttonType: "Download",
                      })
                    });
                  }
                });
                this.setState({
                  buttonType: "Stop",
                })
              }
            }
            }
          >Download</button>
        </div>
      )
    } else {
      return (
        <div className={this.props.cssClass}>
          <button className={cssStyle.BtnAnimated} ref={(button) => { stopBtn = button }}
            onClick={(event) => {
              stopBtn.disabled = true;
              const data = {
                reqType: "abort",
                abortRequestFor: "preRun",
                workspaceId: currentWorkspace.id,
                workspaceName: currentWorkspace.name.current,
              };
              const dataJSON = JSON.stringify(data);
              Ajax("POST", "/").contentType("json").done(dataJSON, (response) => {
                const parsedResponse = JSON.parse(response);
                this.props.getRunResponse(currentWorkspace.id, parsedResponse);
                this.setState({
                  buttonType: "Download",
                })
              });
              stopBtn.onClick = null;
            }}
          >Stop</button>
        </div>
      )
    }
  }
})

export default memo(DownloadStopButton);
