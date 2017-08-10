module.exports = `
syntax = "proto3";

package socketclusterapi;

message ApiCall {
  uint32 cid = 1;
  string event = 2;
  message Data {
    string resource = 1;
    string method = 2;
    string dataType = 3;
    bytes buffer = 4;
  }

  Data data = 3;
}

message ApiResponse {
  uint32 rid = 1;

  message Data {
    bool isError = 1;
    string dataType = 2;
    bytes buffer = 3;
  };

  Data data = 2;
}

message ApiError {
  uint32 code = 1;
  string reason = 2;
  string description = 3;
}
`;
