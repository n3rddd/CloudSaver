import { AxiosInstance, AxiosHeaders } from "axios";
import { Logger } from "../utils/logger";
import { createAxiosInstance } from "../utils/axiosInstance";

export class QuarkService {
  private api: AxiosInstance;

  constructor(cookie: string) {
    if (!cookie) {
      throw new Error("115网盘需要提供cookie进行身份验证");
    }

    this.api = createAxiosInstance(
      "https://drive-h.quark.cn",
      AxiosHeaders.from({
        cookie: cookie,
        accept: "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua": '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      })
    );
  }

  async getShareInfo(pwdId: string, passcode = "") {
    try {
      const response = await this.api.post(
        `/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc&uc_param_str=&__dt=994&__t=${Date.now()}`,
        {
          pwd_id: pwdId,
          passcode: "",
        }
      );
      if (response.data?.status === 200 && response.data.data) {
        const fileInfo = response.data.data;
        if (fileInfo.stoken) {
          let res = await this.getShareList(pwdId, fileInfo.stoken);
          return {
            success: true,
            data: res,
          };
        }
      }
      return {
        success: false,
        error: "未找到文件信息",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  async getShareList(pwdId: string, stoken: string) {
    try {
      const response = await this.api.get("/1/clouddrive/share/sharepage/detail", {
        params: {
          pr: "ucpro",
          fr: "pc",
          uc_param_str: "",
          pwd_id: pwdId,
          stoken: stoken,
          pdir_fid: "0",
          force: "0",
          _page: "1",
          _size: "50",
          _fetch_banner: "1",
          _fetch_share: "1",
          _fetch_total: "1",
          _sort: "file_type:asc,updated_at:desc",
          __dt: "1589",
          __t: Date.now(),
        },
      });
      if (response.data?.data) {
        const list = response.data.data.list
          .filter((item: any) => item.fid)
          .map((folder: any) => ({
            fileId: folder.fid,
            fileName: folder.file_name,
            fileIdToken: folder.share_fid_token,
          }));
        return {
          list,
          pwdId,
          stoken: stoken,
        };
      } else {
        return {
          list: [],
        };
      }
    } catch (error) {
      Logger.error("获取目录列表失败:", error);
      return [];
    }
  }

  async getFolderList(parentCid = "0") {
    try {
      const response = await this.api.get("/1/clouddrive/file/sort", {
        params: {
          pr: "ucpro",
          fr: "pc",
          uc_param_str: "",
          pdir_fid: parentCid,
          _page: "1",
          _size: "100",
          _fetch_total: "false",
          _fetch_sub_dirs: "1",
          _sort: "",
          __dt: "2093126",
          __t: Date.now(),
        },
      });
      if (response.data?.data && response.data.data.list.length) {
        return {
          success: true,
          data: response.data.data.list
            .filter((item: any) => item.fid)
            .map((folder: any) => ({
              cid: folder.fid,
              name: folder.file_name,
              path: [],
            })),
        };
      } else {
        Logger.error("获取目录列表失败:", response.data.error);
        return {
          success: false,
          error: "获取夸克目录列表失败:" + response.data.error,
        };
      }
    } catch (error) {
      Logger.error("获取目录列表失败:", error);
      return {
        success: false,
        error: "获取夸克目录列表失败",
      };
    }
  }

  async saveSharedFile(params: {
    fid_list: string[];
    fid_token_list: string[];
    to_pdir_fid: string;
    pwd_id: string;
    stoken: string;
    pdir_fid: string;
    scene: string;
  }) {
    try {
      const response = await this.api.post(
        `/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc&uc_param_str=&__dt=208097&__t=${Date.now()}`,
        params
      );

      return {
        success: response.data.code === 0,
        error: response.data.message,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }
}
